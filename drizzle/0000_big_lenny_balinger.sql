CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_company" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email_sent_to_creator" boolean DEFAULT false NOT NULL,
	"email_sent_to_sender" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"hooks" jsonb DEFAULT '[]'::jsonb,
	"compensation_type" text DEFAULT 'paid' NOT NULL,
	"compensation_details" text,
	"niches" text[] DEFAULT '{}',
	"platforms" text[] DEFAULT '{}',
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" text NOT NULL,
	"brand_id" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"deadline_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "hashtag_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"post_url" text NOT NULL,
	"post_id" text,
	"author_handle" text NOT NULL,
	"author_name" text,
	"content" text,
	"engagement" jsonb DEFAULT '{}'::jsonb,
	"posted_at" timestamp,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"matched_user_id" text,
	"matched_job_id" uuid,
	"matched_hook" text,
	"hook_match_confidence" text,
	"source" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "hashtag_mentions_post_url_unique" UNIQUE("post_url")
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'creator' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"used_by" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by" text,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"filename" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"threshold" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"reward_type" text NOT NULL,
	"reward_config" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"link" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_questionnaires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"portfolio_vision" text NOT NULL,
	"inspiring_brands" text,
	"portfolio_examples" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_generations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"questionnaire_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"github_repo" text,
	"deployment_url" text,
	"preview_url" text,
	"files_generated" integer,
	"error" text,
	"error_step" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "portfolio_view_dedupe" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"ip_hash" varchar(16) NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"post_url" text NOT NULL,
	"post_id" text,
	"posted_at" timestamp,
	"verified" boolean DEFAULT false NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"milestone_id" uuid NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"month_year" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text,
	"display_name" text,
	"bio" text,
	"website_url" text,
	"instagram_handles" text[],
	"tiktok_handles" text[],
	"youtube_handles" text[],
	"twitter_handles" text[],
	"subdomain" text,
	"status" text DEFAULT 'active' NOT NULL,
	"role" text DEFAULT 'creator' NOT NULL,
	"status_changed_at" timestamp,
	"status_changed_by" text,
	"profile_view_count" integer DEFAULT 0 NOT NULL,
	"portfolio_view_count" integer DEFAULT 0 NOT NULL,
	"vercel_project_id" text,
	"site_enabled" boolean DEFAULT false NOT NULL,
	"github_access_token" text,
	"github_refresh_token" text,
	"github_username" text,
	"github_connected_at" timestamp,
	"github_repo_full_name" text,
	"github_repo_id" text,
	"directory_listed" boolean DEFAULT false NOT NULL,
	"available_for_hire" boolean DEFAULT true NOT NULL,
	"niches" text[],
	"location_city" text,
	"location_country" text,
	"rate_range" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"tagline" text,
	"directory_joined_at" timestamp,
	"lifetime_post_count" integer DEFAULT 0 NOT NULL,
	"tracking_hashtag" text,
	"has_advanced_analytics" boolean DEFAULT false NOT NULL,
	"hosting_unlocked_until" timestamp,
	"directory_boost_until" timestamp,
	"monthly_edits_used" integer DEFAULT 0 NOT NULL,
	"monthly_edits_allowance" integer DEFAULT 0 NOT NULL,
	"edits_reset_month" text,
	"unlimited_edits_until" timestamp,
	"last_known_tiktok_video_count" integer,
	"last_known_instagram_post_count" integer,
	"last_known_youtube_video_count" integer,
	"last_scraped_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"profile_views" integer DEFAULT 0 NOT NULL,
	"portfolio_views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "view_history_user_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"instagram_handle" text,
	"tiktok_handle" text,
	"youtube_handle" text,
	"facebook_handle" text,
	"twitter_handle" text,
	"user_type" text DEFAULT 'creator' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"invited_at" timestamp,
	"invited_by" text,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_jobs" ADD CONSTRAINT "content_jobs_brand_id_users_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_mentions" ADD CONSTRAINT "hashtag_mentions_matched_user_id_users_id_fk" FOREIGN KEY ("matched_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtag_mentions" ADD CONSTRAINT "hashtag_mentions_matched_job_id_content_jobs_id_fk" FOREIGN KEY ("matched_job_id") REFERENCES "public"."content_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_questionnaires" ADD CONSTRAINT "onboarding_questionnaires_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_generations" ADD CONSTRAINT "portfolio_generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_generations" ADD CONSTRAINT "portfolio_generations_questionnaire_id_onboarding_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."onboarding_questionnaires"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_view_dedupe" ADD CONSTRAINT "portfolio_view_dedupe_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_creators" ADD CONSTRAINT "saved_creators_brand_id_users_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_creators" ADD CONSTRAINT "saved_creators_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_milestones" ADD CONSTRAINT "user_milestones_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_history" ADD CONSTRAINT "view_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_submissions_creator_id_idx" ON "contact_submissions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "contact_submissions_created_at_idx" ON "contact_submissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_jobs_status_idx" ON "content_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_jobs_created_by_idx" ON "content_jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "content_jobs_brand_id_idx" ON "content_jobs" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "content_jobs_created_at_idx" ON "content_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_platform_idx" ON "hashtag_mentions" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_posted_at_idx" ON "hashtag_mentions" USING btree ("posted_at");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_author_handle_idx" ON "hashtag_mentions" USING btree ("author_handle");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_matched_user_id_idx" ON "hashtag_mentions" USING btree ("matched_user_id");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_matched_job_id_idx" ON "hashtag_mentions" USING btree ("matched_job_id");--> statement-breakpoint
CREATE INDEX "hashtag_mentions_source_idx" ON "hashtag_mentions" USING btree ("source");--> statement-breakpoint
CREATE INDEX "invites_token_idx" ON "invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invites_email_idx" ON "invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invites_created_by_idx" ON "invites" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "media_user_id_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_type_idx" ON "media" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "onboarding_questionnaires_user_id_idx" ON "onboarding_questionnaires" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "onboarding_questionnaires_created_at_idx" ON "onboarding_questionnaires" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "portfolio_generations_user_id_idx" ON "portfolio_generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "portfolio_generations_status_idx" ON "portfolio_generations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "portfolio_generations_questionnaire_id_idx" ON "portfolio_generations" USING btree ("questionnaire_id");--> statement-breakpoint
CREATE INDEX "portfolio_views_user_ip_time_idx" ON "portfolio_view_dedupe" USING btree ("user_id","ip_hash","viewed_at");--> statement-breakpoint
CREATE INDEX "posts_user_id_idx" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_platform_idx" ON "posts" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "posts_user_created_at_idx" ON "posts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_creators_brand_creator_unique" ON "saved_creators" USING btree ("brand_id","creator_id");--> statement-breakpoint
CREATE INDEX "saved_creators_brand_id_idx" ON "saved_creators" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "saved_creators_creator_id_idx" ON "saved_creators" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "user_milestones_user_id_idx" ON "user_milestones" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_milestones_milestone_id_idx" ON "user_milestones" USING btree ("milestone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_subdomain_idx" ON "users" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX "view_history_user_id_idx" ON "view_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "view_history_date_idx" ON "view_history" USING btree ("date");--> statement-breakpoint
CREATE INDEX "waitlist_email_idx" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "waitlist_created_at_idx" ON "waitlist" USING btree ("created_at");