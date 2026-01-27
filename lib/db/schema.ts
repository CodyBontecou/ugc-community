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

export const users = pgTable("users", {
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
});

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
// Portfolio Tables
// =====================================================

export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull().default("default"),
    title: text("title").notNull(),
    tagline: text("tagline"),
    theme: jsonb("theme").$type<PortfolioTheme>().default({}),
    content: jsonb("content").$type<PortfolioContent>().default({}),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("portfolios_user_id_idx").on(table.userId),
    index("portfolios_is_published_idx").on(table.isPublished),
  ]
);

export const portfolioSections = pgTable(
  "portfolio_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // hero, about, work, contact, etc.
    order: integer("order").notNull().default(0),
    content: jsonb("content").$type<SectionContent>().default({}),
    styles: jsonb("styles").$type<SectionStyles>().default({}),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("portfolio_sections_portfolio_id_idx").on(table.portfolioId),
    index("portfolio_sections_order_idx").on(table.order),
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
    portfolioId: uuid("portfolio_id").references(() => portfolios.id, {
      onDelete: "set null",
    }),
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
    index("media_portfolio_id_idx").on(table.portfolioId),
    index("media_type_idx").on(table.type),
  ]
);

// =====================================================
// Creator Directory Tables
// =====================================================

export const creatorDirectory = pgTable(
  "creator_directory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    isListed: boolean("is_listed").notNull().default(false),
    categories: text("categories").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    priceRangeMin: integer("price_range_min"),
    priceRangeMax: integer("price_range_max"),
    location: text("location"),
    // Denormalized stats for search performance
    followerCount: integer("follower_count").default(0),
    portfolioViews: integer("portfolio_views").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("creator_directory_is_listed_idx").on(table.isListed),
    index("creator_directory_categories_idx").on(table.categories),
  ]
);

// =====================================================
// Contact Form Submissions
// =====================================================

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    company: text("company"),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("contact_submissions_portfolio_id_idx").on(table.portfolioId),
    index("contact_submissions_is_read_idx").on(table.isRead),
  ]
);

// =====================================================
// Relations
// =====================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  portfolios: many(portfolios),
  media: many(media),
  directoryListing: one(creatorDirectory, {
    fields: [users.id],
    references: [creatorDirectory.userId],
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

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  sections: many(portfolioSections),
  media: many(media),
  contactSubmissions: many(contactSubmissions),
  directoryListing: one(creatorDirectory, {
    fields: [portfolios.id],
    references: [creatorDirectory.portfolioId],
  }),
}));

export const portfolioSectionsRelations = relations(
  portfolioSections,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [portfolioSections.portfolioId],
      references: [portfolios.id],
    }),
  })
);

export const mediaRelations = relations(media, ({ one }) => ({
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [media.portfolioId],
    references: [portfolios.id],
  }),
}));

export const creatorDirectoryRelations = relations(
  creatorDirectory,
  ({ one }) => ({
    user: one(users, {
      fields: [creatorDirectory.userId],
      references: [users.id],
    }),
    portfolio: one(portfolios, {
      fields: [creatorDirectory.portfolioId],
      references: [portfolios.id],
    }),
  })
);

export const contactSubmissionsRelations = relations(
  contactSubmissions,
  ({ one }) => ({
    portfolio: one(portfolios, {
      fields: [contactSubmissions.portfolioId],
      references: [portfolios.id],
    }),
  })
);

// =====================================================
// Types
// =====================================================

export type PortfolioTheme = {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  customCss?: string;
};

export type PortfolioContent = {
  headline?: string;
  subheadline?: string;
  about?: string;
  services?: string[];
  socialLinks?: {
    platform: string;
    url: string;
    followerCount?: number;
  }[];
};

export type SectionContent = {
  title?: string;
  subtitle?: string;
  body?: string;
  items?: unknown[];
  mediaIds?: string[];
  ctaText?: string;
  ctaUrl?: string;
};

export type SectionStyles = {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  customCss?: string;
};

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
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;
export type PortfolioSection = typeof portfolioSections.$inferSelect;
export type NewPortfolioSection = typeof portfolioSections.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type CreatorDirectoryEntry = typeof creatorDirectory.$inferSelect;
export type NewCreatorDirectoryEntry = typeof creatorDirectory.$inferInsert;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type NewContactSubmission = typeof contactSubmissions.$inferInsert;
