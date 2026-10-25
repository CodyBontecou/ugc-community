import type { D1Database } from "@/cloudflare-env";
import { analyticsPath, RETENTION_DAYS, type EventBatch, type EventProperties, type ServerEvent } from "./model";

export async function writeEvents(db: D1Database, batch: EventBatch, now = new Date()) {
  const receivedAt = now.toISOString();
  await db.batch(batch.events.map(event => db.prepare(`INSERT OR IGNORE INTO analytics_events
    (id, session_id, name, path, source, device, properties, origin, occurred_at, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'browser', ?, ?)`)
    .bind(event.id, batch.sessionId, event.name, analyticsPath(event.path), batch.source, batch.device, JSON.stringify(event.properties), new Date(Math.max(now.getTime() - 300_000, Math.min(now.getTime(), Date.parse(event.occurredAt)))).toISOString(), receivedAt)));
}
export async function writeServerEvent(db: D1Database, sessionId: string, name: ServerEvent, path: string, properties: EventProperties, identity?: string) {
  // Stable IDs deduplicate application retries and repeated job-submission responses.
  await db.prepare(`INSERT OR IGNORE INTO analytics_events
    (id, session_id, name, path, source, device, properties, origin, occurred_at, received_at)
    VALUES (?, ?, ?, ?, 'internal', 'desktop', ?, 'server', ?, ?)`)
    .bind(identity ? `${name}:${identity}` : crypto.randomUUID(), sessionId, name, analyticsPath(path), JSON.stringify(properties), new Date().toISOString(), new Date().toISOString()).run();
}
export async function pruneEvents(db: D1Database, now = new Date()) {
  return db.prepare("DELETE FROM analytics_events WHERE received_at < ?")
    .bind(new Date(now.getTime() - RETENTION_DAYS * 86400_000).toISOString()).run();
}
