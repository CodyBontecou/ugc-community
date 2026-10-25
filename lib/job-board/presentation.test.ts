import { test } from "node:test";
import assert from "node:assert/strict";
import { compensationSummary } from "./presentation";

test("compensation summaries preserve rates, units and qualifications without inferring currency", () => {
  assert.equal(compensationSummary("$150–$250 per video, negotiable. Currency not specified.", "cash"), "$150–$250 per video");
  assert.equal(compensationSummary("Up to $1.50 per 1,000 views; paid monthly.", "performance_only"), "Up to $1.50 per 1,000 views");
  assert.equal(compensationSummary("€600 fixed compensation plus a bonus based on views.", "mixed"), "€600 fixed compensation plus a bonus based on views");
  assert.equal(compensationSummary("", "unspecified"), "Pay not specified");
});
