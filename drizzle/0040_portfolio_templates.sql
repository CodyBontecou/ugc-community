-- Migration: Portfolio Templates System
-- Adds templates and portfolio_configs tables
-- Removes AI generation tables (onboarding_questionnaires, portfolio_generations)

-- =====================================================
-- Create templates table
-- =====================================================

CREATE TABLE IF NOT EXISTS "templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text,
  "preview_image_url" text,
  "section_defaults" jsonb NOT NULL DEFAULT '{}',
  "theme_defaults" jsonb NOT NULL DEFAULT '{}',
  "available_sections" text[] NOT NULL DEFAULT ARRAY['hero', 'about', 'work', 'services', 'testimonials', 'stats', 'contact'],
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- =====================================================
-- Create portfolio_configs table
-- =====================================================

CREATE TABLE IF NOT EXISTS "portfolio_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "template_id" uuid REFERENCES "templates"("id") ON DELETE SET NULL,
  "sections" jsonb NOT NULL DEFAULT '{}',
  "theme" jsonb NOT NULL DEFAULT '{}',
  "custom_css" text,
  "seo" jsonb NOT NULL DEFAULT '{}',
  "is_published" boolean NOT NULL DEFAULT false,
  "published_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Indexes for portfolio_configs
CREATE INDEX IF NOT EXISTS "portfolio_configs_user_id_idx" ON "portfolio_configs" ("user_id");
CREATE INDEX IF NOT EXISTS "portfolio_configs_template_id_idx" ON "portfolio_configs" ("template_id");
CREATE INDEX IF NOT EXISTS "portfolio_configs_is_published_idx" ON "portfolio_configs" ("is_published");

-- =====================================================
-- Seed initial templates
-- =====================================================

INSERT INTO "templates" ("slug", "name", "description", "section_defaults", "theme_defaults", "available_sections") VALUES
(
  'minimal',
  'Minimal',
  'Clean and typography-focused with lots of whitespace. Let your content speak for itself.',
  '{
    "order": ["hero", "about", "work", "contact"],
    "hero": {"variant": "centered", "content": {}},
    "about": {"variant": "default", "content": {}},
    "work": {"variant": "grid", "content": {}},
    "contact": {"variant": "simple", "content": {}}
  }',
  '{
    "colors": {
      "primary": "#18181b",
      "secondary": "#3f3f46",
      "accent": "#f97316",
      "background": "#ffffff",
      "surface": "#fafafa",
      "text": {"primary": "#18181b", "secondary": "#71717a", "inverse": "#ffffff"},
      "border": "#e4e4e7"
    },
    "typography": {
      "headingFont": "Inter",
      "bodyFont": "Inter",
      "baseSize": 16,
      "scale": 1.25
    },
    "spacing": {"sectionGap": "spacious", "contentWidth": "narrow"},
    "effects": {"borderRadius": "subtle", "shadows": "none", "animations": true}
  }',
  ARRAY['hero', 'about', 'work', 'services', 'testimonials', 'stats', 'contact', 'custom']
),
(
  'bold',
  'Bold',
  'High contrast with dramatic layouts and large imagery. Make an impact.',
  '{
    "order": ["hero", "work", "about", "stats", "contact"],
    "hero": {"variant": "video-bg", "content": {}},
    "work": {"variant": "featured", "content": {}},
    "about": {"variant": "with-stats", "content": {}},
    "stats": {"variant": "large", "content": {}},
    "contact": {"variant": "cta", "content": {}}
  }',
  '{
    "colors": {
      "primary": "#ffffff",
      "secondary": "#a1a1aa",
      "accent": "#22d3ee",
      "background": "#09090b",
      "surface": "#18181b",
      "text": {"primary": "#ffffff", "secondary": "#a1a1aa", "inverse": "#09090b"},
      "border": "#27272a"
    },
    "typography": {
      "headingFont": "Space Grotesk",
      "bodyFont": "Inter",
      "baseSize": 16,
      "scale": 1.5
    },
    "spacing": {"sectionGap": "normal", "contentWidth": "wide"},
    "effects": {"borderRadius": "none", "shadows": "dramatic", "animations": true}
  }',
  ARRAY['hero', 'about', 'work', 'services', 'testimonials', 'stats', 'contact', 'custom']
),
(
  'elegant',
  'Elegant',
  'Sophisticated and refined with editorial-style layouts. Perfect for luxury and lifestyle.',
  '{
    "order": ["hero", "about", "work", "testimonials", "contact"],
    "hero": {"variant": "split-right", "content": {}},
    "about": {"variant": "centered", "content": {}},
    "work": {"variant": "masonry", "content": {}},
    "testimonials": {"variant": "featured", "content": {}},
    "contact": {"variant": "split", "content": {}}
  }',
  '{
    "colors": {
      "primary": "#1c1917",
      "secondary": "#57534e",
      "accent": "#b45309",
      "background": "#faf9f7",
      "surface": "#ffffff",
      "text": {"primary": "#1c1917", "secondary": "#78716c", "inverse": "#faf9f7"},
      "border": "#e7e5e4"
    },
    "typography": {
      "headingFont": "Cormorant Garamond",
      "bodyFont": "Source Sans Pro",
      "baseSize": 17,
      "scale": 1.333
    },
    "spacing": {"sectionGap": "spacious", "contentWidth": "normal"},
    "effects": {"borderRadius": "subtle", "shadows": "subtle", "animations": true}
  }',
  ARRAY['hero', 'about', 'work', 'services', 'testimonials', 'stats', 'contact', 'custom']
);

-- =====================================================
-- Remove AI generation tables
-- =====================================================

-- Drop foreign key constraints first
ALTER TABLE "portfolio_generations" DROP CONSTRAINT IF EXISTS "portfolio_generations_user_id_users_id_fk";
ALTER TABLE "portfolio_generations" DROP CONSTRAINT IF EXISTS "portfolio_generations_questionnaire_id_onboarding_questionnaires_id_fk";
ALTER TABLE "onboarding_questionnaires" DROP CONSTRAINT IF EXISTS "onboarding_questionnaires_user_id_users_id_fk";

-- Drop indexes
DROP INDEX IF EXISTS "portfolio_generations_user_id_idx";
DROP INDEX IF EXISTS "portfolio_generations_status_idx";
DROP INDEX IF EXISTS "portfolio_generations_questionnaire_id_idx";
DROP INDEX IF EXISTS "onboarding_questionnaires_user_id_idx";
DROP INDEX IF EXISTS "onboarding_questionnaires_created_at_idx";

-- Drop tables
DROP TABLE IF EXISTS "portfolio_generations";
DROP TABLE IF EXISTS "onboarding_questionnaires";

-- =====================================================
-- Remove GitHub deployment columns from users
-- (keeping for now - may be useful for other features)
-- =====================================================
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_access_token";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_refresh_token";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_username";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_connected_at";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_repo_full_name";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "github_repo_id";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "vercel_project_id";
