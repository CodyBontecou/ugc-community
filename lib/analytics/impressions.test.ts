import { test } from "node:test";
import assert from "node:assert/strict";
import { impressionClock, observeListingImpressions, IMPRESSION_DURATION_MS } from "./impressions";
function setup() {
  let time = 0;
  const pending = new Map<number, { at: number; callback: () => void }>();
  let nextId = 0;
  const seen: string[] = [];
  const clock = impressionClock(id => seen.push(id), (callback, delay) => {
    const id = ++nextId; pending.set(id, { callback, at: time + delay }); return () => { pending.delete(id); };
  });
  const advance = (ms: number) => { time += ms; for (const [id, item] of [...pending]) if (item.at <= time) { pending.delete(id); item.callback(); } };
  return { clock, seen, advance };
}
test("an active view requires a complete uninterrupted second", () => {
  const { clock, seen, advance } = setup(); clock.active(true); clock.visible("job-a", true);
  advance(IMPRESSION_DURATION_MS - 1); assert.deepEqual(seen, []);
  advance(1); assert.deepEqual(seen, ["job-a"]);
});
test("scrolling out resets the viewability clock", () => {
  const { clock, seen, advance } = setup(); clock.active(true); clock.visible("job-a", true);
  advance(700); clock.visible("job-a", false); advance(500); assert.deepEqual(seen, []);
  clock.visible("job-a", true); advance(999); assert.deepEqual(seen, []); advance(1); assert.deepEqual(seen, ["job-a"]);
});
test("hidden or blurred tabs do not accrue view time", () => {
  const { clock, seen, advance } = setup(); clock.visible("job-a", true); advance(5000); assert.deepEqual(seen, []);
  clock.active(true); advance(600); clock.active(false); advance(1000); assert.deepEqual(seen, []);
  clock.active(true); advance(1000); assert.deepEqual(seen, ["job-a"]);
});
test("each listing is emitted once per observer lifetime, even after repeated visibility callbacks", () => {
  const { clock, seen, advance } = setup(); clock.active(true);
  clock.visible("job-a", true); clock.visible("job-a", true); clock.visible("job-b", true); advance(1000);
  clock.visible("job-a", false); clock.visible("job-a", true); advance(2000);
  assert.deepEqual(seen, ["job-a", "job-b"]);
});
test("navigation or consent withdrawal cancels pending impressions", () => {
  const { clock, seen, advance } = setup(); clock.active(true); clock.visible("job-a", true); advance(500); clock.disconnect(); advance(2000); assert.deepEqual(seen, []);
});

function browserFixture() {
  let focused = true, visibility = "visible";
  let deliver: IntersectionObserverCallback;
  let mutate: () => void;
  const observed: Element[] = [];
  const summary = { isConnected: true } as Element;
  const row = { getAttribute: () => "public-job", querySelector: () => summary };
  const rows = [row];
  const doc = Object.assign(new EventTarget(), {
    body: {}, querySelectorAll: () => rows,
    hasFocus: () => focused,
  });
  Object.defineProperty(doc, "visibilityState", { get: () => visibility });
  class VisibilityObserver {
    constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
      deliver = callback; assert.deepEqual(options.threshold, [0.5]);
    }
    observe(element: Element) { observed.push(element); }
    unobserve(element: Element) { observed.splice(observed.indexOf(element), 1); }
    disconnect() { observed.length = 0; }
  }
  class Mutations {
    constructor(callback: () => void) { mutate = callback; }
    observe() {} disconnect() {}
  }
  const win = Object.assign(new EventTarget(), { IntersectionObserver: VisibilityObserver, MutationObserver: Mutations });
  return {
    doc: doc as unknown as Document, win: win as unknown as typeof window, summary, rows, observed,
    intersection(ratio: number) { deliver([{ target: summary, isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver); },
    focus(value: boolean) { focused = value; win.dispatchEvent(new Event(value ? "focus" : "blur")); },
    visibility(value: string) { visibility = value; doc.dispatchEvent(new Event("visibilitychange")); },
    insert() { rows.push(row); mutate(); },
    remove() { Object.assign(summary, { isConnected: false }); rows.length = 0; mutate(); },
  };
}
test("DOM observer watches collapsed summaries and rejects less than half-visible rows", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fixture = browserFixture(), seen: string[] = [];
  const stop = observeListingImpressions(id => seen.push(id), fixture.doc, fixture.win);
  assert.equal(fixture.observed[0], fixture.summary);
  fixture.intersection(0.49); t.mock.timers.tick(2000); assert.deepEqual(seen, []);
  fixture.intersection(0.5); t.mock.timers.tick(999); assert.deepEqual(seen, []);
  t.mock.timers.tick(1); assert.deepEqual(seen, ["public-job"]);
  stop(); assert.equal(fixture.observed.length, 0);
});
test("DOM observer cancels on blur, hidden tabs, removed rows and disposal", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fixture = browserFixture(), seen: string[] = [];
  const stop = observeListingImpressions(id => seen.push(id), fixture.doc, fixture.win);
  fixture.intersection(1); t.mock.timers.tick(500); fixture.focus(false); t.mock.timers.tick(1000);
  assert.deepEqual(seen, []);
  fixture.focus(true); t.mock.timers.tick(500); fixture.visibility("hidden"); t.mock.timers.tick(1000);
  assert.deepEqual(seen, []);
  fixture.visibility("visible"); t.mock.timers.tick(500); fixture.remove(); t.mock.timers.tick(1000);
  assert.deepEqual(seen, []); stop();
});
test("listings inserted after hydration are observed", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const fixture = browserFixture(), seen: string[] = [];
  fixture.rows.length = 0;
  const stop = observeListingImpressions(id => seen.push(id), fixture.doc, fixture.win);
  assert.equal(fixture.observed.length, 0);
  fixture.insert(); assert.equal(fixture.observed[0], fixture.summary);
  fixture.intersection(0.5); t.mock.timers.tick(1000); assert.deepEqual(seen, ["public-job"]); stop();
});
test("unsupported visibility observation does not fabricate impressions", () => {
  const fixture = browserFixture();
  const stop = observeListingImpressions(() => assert.fail("Must not emit without visibility observation"), fixture.doc, {} as typeof window);
  assert.equal(typeof stop, "function"); stop();
});
