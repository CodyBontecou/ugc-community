import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =====================================================
// Better Auth Tables
// =====================================================

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    // Custom extensions for ugc.community
    username: text("username").unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    websiteUrl: text("website_url"),
    instagramHandle: text("instagram_handle"),
    tiktokHandle: text("tiktok_handle"),
    youtubeHandle: text("youtube_handle"),
    twitterHandle: text("twitter_handle"),
    // Subdomain for custom URL (e.g., johndoe.mysite.com)
    // Stored as lowercase for consistent matching
    subdomain: text("subdomain").unique(),
    // Admin fields for user status management
    status: text("status").notNull().default("active"), // "active" | "suspended" | "banned"
    statusChangedAt: timestamp("status_changed_at"),
    statusChangedBy: text("status_changed_by"),
    // Profile analytics
    profileViewCount: integer("profile_view_count").notNull().default(0),
    // Vercel subdomain integration
    vercelProjectId: text("vercel_project_id"),
    siteEnabled: boolean("site_enabled").notNull().default(false),
  },
  (table) => [
    // Index for fast subdomain lookups (directory queries, routing)
    uniqueIndex("users_subdomain_idx").on(table.subdomain),
  ]
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================
// Invite System Tables
// =====================================================

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    email: text("email"), // Optional - can pre-assign to specific email
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    usedBy: text("used_by").references(() => users.id, { onDelete: "set null" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    // Admin fields for invite revocation
    revokedAt: timestamp("revoked_at"),
    revokedBy: text("revoked_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("invites_token_idx").on(table.token),
    index("invites_email_idx").on(table.email),
    index("invites_created_by_idx").on(table.createdBy),
  ]
);

// =====================================================
// Waitlist Tables
// =====================================================

export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    instagramHandle: text("instagram_handle"),
    tiktokHandle: text("tiktok_handle"),
    youtubeHandle: text("youtube_handle"),
    facebookHandle: text("facebook_handle"),
    twitterHandle: text("twitter_handle"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    // Track if they've been invited
    invitedAt: timestamp("invited_at"),
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    index("waitlist_email_idx").on(table.email),
    index("waitlist_created_at_idx").on(table.createdAt),
  ]
);

// =====================================================
// Media Tables
// =====================================================

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // image, video
    filename: text("filename").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(), // bytes
    url: text("url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    metadata: jsonb("metadata").$type<MediaMetadata>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("media_user_id_idx").on(table.userId),
    index("media_type_idx").on(table.type),
  ]
);

// =====================================================
// Relations
// =====================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  media: many(media),
  createdInvites: many(invites, { relationName: "createdInvites" }),
  usedInvite: one(invites, {
    fields: [users.id],
    references: [invites.usedBy],
    relationName: "usedInvite",
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  creator: one(users, {
    fields: [invites.createdBy],
    references: [users.id],
    relationName: "createdInvites",
  }),
  usedByUser: one(users, {
    fields: [invites.usedBy],
    references: [users.id],
    relationName: "usedInvite",
  }),
}));

// =====================================================
// Types
// =====================================================

export type MediaMetadata = {
  width?: number;
  height?: number;
  duration?: number; // seconds, for videos
  alt?: string;
  caption?: string;
};

// Export types for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
