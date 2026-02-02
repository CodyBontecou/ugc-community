import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  varchar,
  index,
  uniqueIndex,
  date,
  unique,
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
    instagramHandles: text("instagram_handles").array(),
    tiktokHandles: text("tiktok_handles").array(),
    youtubeHandles: text("youtube_handles").array(),
    twitterHandles: text("twitter_handles").array(),
    // Subdomain for custom URL (e.g., johndoe.mysite.com)
    // Stored as lowercase for consistent matching
    subdomain: text("subdomain").unique(),
    // Admin fields for user status management
    status: text("status").notNull().default("active"), // "active" | "suspended" | "banned"
    // User role - all users are creators now
    role: text("role").notNull().default("creator"),
    statusChangedAt: timestamp("status_changed_at"),
    statusChangedBy: text("status_changed_by"),
    // Profile analytics
    profileViewCount: integer("profile_view_count").notNull().default(0),
    portfolioViewCount: integer("portfolio_view_count").notNull().default(0),
    // Vercel subdomain integration
    vercelProjectId: text("vercel_project_id"),
    siteEnabled: boolean("site_enabled").notNull().default(false),
    // Admin GitHub connection for deployment management
    githubAccessToken: text("github_access_token"),
    githubRefreshToken: text("github_refresh_token"),
    githubUsername: text("github_username"),
    githubConnectedAt: timestamp("github_connected_at"),
    // GitHub repository assigned to user for deployment
    githubRepoFullName: text("github_repo_full_name"),
    githubRepoId: text("github_repo_id"),
    // Directory listing fields (kept for profile use)
    directoryListed: boolean("directory_listed").notNull().default(false),
    availableForHire: boolean("available_for_hire").notNull().default(true),
    niches: text("niches").array(),
    locationCity: text("location_city"),
    locationCountry: text("location_country"),
    rateRange: text("rate_range"), // 'budget' | 'mid' | 'premium' | null
    isFeatured: boolean("is_featured").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    tagline: text("tagline"),
    directoryJoinedAt: timestamp("directory_joined_at"),
    // Milestone system fields
    lifetimePostCount: integer("lifetime_post_count").notNull().default(0),
    // Milestone reward fields
    hasAdvancedAnalytics: boolean("has_advanced_analytics").notNull().default(false),
    hostingUnlockedUntil: timestamp("hosting_unlocked_until"),
    directoryBoostUntil: timestamp("directory_boost_until"),
    // Edit allowance fields (monthly milestone rewards)
    monthlyEditsUsed: integer("monthly_edits_used").notNull().default(0),
    monthlyEditsAllowance: integer("monthly_edits_allowance").notNull().default(0),
    editsResetMonth: text("edits_reset_month"), // Format: '2026-01'
    unlimitedEditsUntil: timestamp("unlimited_edits_until"),
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
// Onboarding Questionnaires
// =====================================================

export type SocialMediaHandle = {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "other";
  handle: string;
};

export const onboardingQuestionnaires = pgTable(
  "onboarding_questionnaires",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    portfolioVision: text("portfolio_vision").notNull(),
    inspiringBrands: text("inspiring_brands"),
    portfolioExamples: text("portfolio_examples"),
    // Structured fields for better data management
    socialMediaHandles: jsonb("social_media_handles").$type<SocialMediaHandle[]>().default([]),
    inspirationUrls: text("inspiration_urls").array().default([]),
    inspiringBrandsList: text("inspiring_brands_list").array().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("onboarding_questionnaires_user_id_idx").on(table.userId),
    index("onboarding_questionnaires_created_at_idx").on(table.createdAt),
  ]
);

// =====================================================
// Portfolio Generations (Status Tracking)
// =====================================================

export const portfolioGenerations = pgTable(
  "portfolio_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionnaireId: uuid("questionnaire_id").references(
      () => onboardingQuestionnaires.id,
      { onDelete: "set null" }
    ),
    // Status: 'pending', 'generating', 'pushing', 'deploying', 'completed', 'failed'
    status: text("status").notNull().default("pending"),
    githubRepo: text("github_repo"),
    deploymentUrl: text("deployment_url"),
    previewUrl: text("preview_url"),
    filesGenerated: integer("files_generated"),
    error: text("error"),
    errorStep: text("error_step"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("portfolio_generations_user_id_idx").on(table.userId),
    index("portfolio_generations_status_idx").on(table.status),
    index("portfolio_generations_questionnaire_id_idx").on(
      table.questionnaireId
    ),
  ]
);

// =====================================================
// Contact Submissions Tables
// =====================================================

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    senderCompany: text("sender_company").notNull(),
    message: text("message"), // Optional - store for reference/debugging
    createdAt: timestamp("created_at").notNull().defaultNow(),
    emailSentToCreator: boolean("email_sent_to_creator").notNull().default(false),
    emailSentToSender: boolean("email_sent_to_sender").notNull().default(false),
  },
  (table) => [
    index("contact_submissions_creator_id_idx").on(table.creatorId),
    index("contact_submissions_created_at_idx").on(table.createdAt),
  ]
);

// =====================================================
// Portfolio View Tracking (for deduplication)
// =====================================================

export const portfolioViewDedupe = pgTable(
  "portfolio_view_dedupe",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ipHash: varchar("ip_hash", { length: 16 }).notNull(),
    viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  },
  (table) => [
    index("portfolio_views_user_ip_time_idx").on(
      table.userId,
      table.ipHash,
      table.viewedAt
    ),
  ]
);

// =====================================================
// View History (Daily view tracking for analytics)
// =====================================================

export const viewHistory = pgTable(
  "view_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    profileViews: integer("profile_views").notNull().default(0),
    portfolioViews: integer("portfolio_views").notNull().default(0),
  },
  (table) => [
    index("view_history_user_id_idx").on(table.userId),
    index("view_history_date_idx").on(table.date),
    unique("view_history_user_date_unique").on(table.userId, table.date),
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
// Posts (External Social Media Tracking)
// =====================================================

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(), // 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook'
    postUrl: text("post_url").notNull(),
    postId: text("post_id"), // Platform-specific post ID (optional)
    postedAt: timestamp("posted_at"), // When post was made on platform
    verified: boolean("verified").notNull().default(false), // Provider verification status
    source: text("source").notNull().default("manual"), // Provider name: 'apify', 'brand24', etc.
    metadata: jsonb("metadata").$type<PostMetadata>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("posts_user_id_idx").on(table.userId),
    index("posts_platform_idx").on(table.platform),
    index("posts_user_created_at_idx").on(table.userId, table.createdAt),
  ]
);

// =====================================================
// Milestones System
// =====================================================

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(), // 'monthly' | 'lifetime'
    threshold: integer("threshold").notNull(), // Posts required
    name: text("name").notNull(),
    description: text("description"),
    rewardType: text("reward_type").notNull(), // 'hosting' | 'analytics' | 'edits' | 'directory_boost' | 'badge' | 'custom_domain'
    rewardConfig: jsonb("reward_config").$type<MilestoneRewardConfig>().default({}),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  }
);

export const userMilestones = pgTable(
  "user_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id")
      .notNull()
      .references(() => milestones.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
    monthYear: text("month_year"), // For monthly: '2026-01', NULL for lifetime
  },
  (table) => [
    index("user_milestones_user_id_idx").on(table.userId),
    index("user_milestones_milestone_id_idx").on(table.milestoneId),
  ]
);

// =====================================================
// Relations
// =====================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  media: many(media),
  contactSubmissions: many(contactSubmissions),
  portfolioViewDedupe: many(portfolioViewDedupe),
  viewHistory: many(viewHistory),
  posts: many(posts),
  userMilestones: many(userMilestones),
  onboardingQuestionnaires: many(onboardingQuestionnaires),
  portfolioGenerations: many(portfolioGenerations),
}));

export const onboardingQuestionnairesRelations = relations(onboardingQuestionnaires, ({ one }) => ({
  user: one(users, {
    fields: [onboardingQuestionnaires.userId],
    references: [users.id],
  }),
  generations: one(portfolioGenerations),
}));

export const portfolioGenerationsRelations = relations(portfolioGenerations, ({ one }) => ({
  user: one(users, {
    fields: [portfolioGenerations.userId],
    references: [users.id],
  }),
  questionnaire: one(onboardingQuestionnaires, {
    fields: [portfolioGenerations.questionnaireId],
    references: [onboardingQuestionnaires.id],
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

export const contactSubmissionsRelations = relations(contactSubmissions, ({ one }) => ({
  creator: one(users, {
    fields: [contactSubmissions.creatorId],
    references: [users.id],
  }),
}));

export const portfolioViewDedupeRelations = relations(portfolioViewDedupe, ({ one }) => ({
  user: one(users, {
    fields: [portfolioViewDedupe.userId],
    references: [users.id],
  }),
}));

export const viewHistoryRelations = relations(viewHistory, ({ one }) => ({
  user: one(users, {
    fields: [viewHistory.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ many }) => ({
  userMilestones: many(userMilestones),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userMilestones.userId],
    references: [users.id],
  }),
  milestone: one(milestones, {
    fields: [userMilestones.milestoneId],
    references: [milestones.id],
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

export type PostMetadata = {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
};

export type MilestoneRewardConfig = {
  duration_days?: number;
  tier?: string;
  unlimited?: boolean;
  featured?: boolean;
  badge_type?: string;
  priority?: boolean;
  permanent?: boolean;
  enabled?: boolean;
  // Edit reward specific
  edits_granted?: number;
  companion_boost_days?: number;
};

// Export types for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
export type PortfolioView = typeof portfolioViewDedupe.$inferSelect;
export type NewPortfolioView = typeof portfolioViewDedupe.$inferInsert;
export type ViewHistory = typeof viewHistory.$inferSelect;
export type NewViewHistory = typeof viewHistory.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Milestone = typeof milestones.$inferSelect;
export type NewMilestone = typeof milestones.$inferInsert;
export type UserMilestone = typeof userMilestones.$inferSelect;
export type NewUserMilestone = typeof userMilestones.$inferInsert;
export type OnboardingQuestionnaire = typeof onboardingQuestionnaires.$inferSelect;
export type NewOnboardingQuestionnaire = typeof onboardingQuestionnaires.$inferInsert;
export type PortfolioGeneration = typeof portfolioGenerations.$inferSelect;
export type NewPortfolioGeneration = typeof portfolioGenerations.$inferInsert;
