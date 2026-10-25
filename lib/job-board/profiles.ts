import { z } from "zod";
import type { D1Database } from "@/cloudflare-env";
import { safeLink } from "./model";
const short = (max: number) => z.string().trim().max(max);
const link = short(2000).refine(value => !value || Boolean(safeLink(value)), "Use a full HTTP or HTTPS link");
export const creatorProfileSchema = z.object({
  name: short(100).min(1, "Enter your name"),
  headline: short(160).min(1, "Add a headline"),
  bio: short(2000).min(20, "Tell brands a little about your work (at least 20 characters)"),
  location: short(160), niches: short(300), availability: short(300),
  instagram: link, tiktok: link, youtube: link, portfolio: link,
}).refine(value => Boolean(value.instagram || value.tiktok || value.youtube || value.portfolio), "Add at least one social or portfolio link");
export type CreatorProfile = z.infer<typeof creatorProfileSchema>;
export function generateProfile(input: { name: string; brief: string; niches: string; location: string }): Pick<CreatorProfile, "headline" | "bio"> {
  const topic = input.niches.trim();
  return {
    headline: `${topic ? `${topic} UGC creator` : "UGC creator"}${input.location.trim() ? ` based in ${input.location.trim()}` : ""}`.slice(0, 160),
    // Use only the creator's supplied facts, without inventing experience or metrics.
    bio: [`I’m ${input.name.trim() || "a UGC creator"}${topic ? `, a creator working in ${topic}` : ", a UGC creator"}${input.location.trim() ? ` based in ${input.location.trim()}` : ""}.`, input.brief.trim()].join("\n\n").slice(0, 2000),
  };
}
export async function getCreatorProfile(db: D1Database, userId: string) {
  const row = await db.prepare("SELECT profile_json, share_id FROM board_creator_profiles WHERE user_id=?").bind(userId).first<{ profile_json: string; share_id: string }>();
  return row ? { profile: creatorProfileSchema.parse(JSON.parse(row.profile_json)), shareId: row.share_id } : null;
}
export async function saveCreatorProfile(db: D1Database, userId: string, input: unknown) {
  const profile = creatorProfileSchema.parse(input);
  await db.prepare(`INSERT INTO board_creator_profiles (user_id, share_id, profile_json, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET profile_json=excluded.profile_json, updated_at=excluded.updated_at`)
    .bind(userId, crypto.randomUUID(), JSON.stringify(profile), new Date().toISOString()).run();
  return (await getCreatorProfile(db, userId))!;
}
