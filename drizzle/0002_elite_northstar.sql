ALTER TABLE "portfolio_generations" ADD COLUMN "design_seed_id" text;--> statement-breakpoint
ALTER TABLE "portfolio_generations" ADD COLUMN "quality_score" integer;--> statement-breakpoint
ALTER TABLE "portfolio_generations" ADD COLUMN "fonts_used" text[];--> statement-breakpoint
ALTER TABLE "portfolio_generations" ADD COLUMN "primary_colors" text[];