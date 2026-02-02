/**
 * Portfolio Template Types
 *
 * Re-exports and extends types from the database schema.
 * These types are used for rendering templates and managing content.
 */

// Re-export database types
export type {
  Template,
  NewTemplate,
  PortfolioConfig,
  NewPortfolioConfig,
  SectionVariant,
  SectionContent,
  SectionConfig,
  SectionDefaults,
  PortfolioSections,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeEffects,
  ThemeConfig,
  PortfolioSeo,
  PortfolioProject,
  PortfolioProjectMedia,
  Media,
  User,
} from "@/lib/db/schema";

// =====================================================
// Section Type Constants
// =====================================================

export const SECTION_TYPES = [
  "hero",
  "about",
  "work",
  "services",
  "testimonials",
  "stats",
  "contact",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

// =====================================================
// Section Variants
// =====================================================

export const HERO_VARIANTS = [
  "centered",
  "split-left",
  "split-right",
  "video-bg",
  "minimal",
] as const;

export const ABOUT_VARIANTS = [
  "default",
  "centered",
  "with-stats",
  "timeline",
] as const;

export const WORK_VARIANTS = [
  "grid",
  "masonry",
  "carousel",
  "featured",
  "list",
] as const;

export const SERVICES_VARIANTS = [
  "cards",
  "list",
  "pricing",
  "icons",
] as const;

export const TESTIMONIALS_VARIANTS = [
  "carousel",
  "grid",
  "featured",
  "marquee",
] as const;

export const STATS_VARIANTS = [
  "inline",
  "cards",
  "large",
  "animated",
] as const;

export const CONTACT_VARIANTS = [
  "simple",
  "form",
  "split",
  "cta",
] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];
export type AboutVariant = (typeof ABOUT_VARIANTS)[number];
export type WorkVariant = (typeof WORK_VARIANTS)[number];
export type ServicesVariant = (typeof SERVICES_VARIANTS)[number];
export type TestimonialsVariant = (typeof TESTIMONIALS_VARIANTS)[number];
export type StatsVariant = (typeof STATS_VARIANTS)[number];
export type ContactVariant = (typeof CONTACT_VARIANTS)[number];

export const SECTION_VARIANTS = {
  hero: HERO_VARIANTS,
  about: ABOUT_VARIANTS,
  work: WORK_VARIANTS,
  services: SERVICES_VARIANTS,
  testimonials: TESTIMONIALS_VARIANTS,
  stats: STATS_VARIANTS,
  contact: CONTACT_VARIANTS,
} as const;

// =====================================================
// Theme Presets
// =====================================================

export const SPACING_GAP_OPTIONS = ["compact", "normal", "spacious"] as const;
export const CONTENT_WIDTH_OPTIONS = ["narrow", "normal", "wide", "full"] as const;
export const BORDER_RADIUS_OPTIONS = ["none", "subtle", "rounded", "pill"] as const;
export const SHADOW_OPTIONS = ["none", "subtle", "medium", "dramatic"] as const;

// =====================================================
// Font Options
// =====================================================

export const HEADING_FONTS = [
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Poppins",
  "Cormorant Garamond",
  "Space Grotesk",
  "DM Serif Display",
] as const;

export const BODY_FONTS = [
  "Inter",
  "Source Sans Pro",
  "Lato",
  "Open Sans",
  "Nunito",
  "Work Sans",
] as const;

export type HeadingFont = (typeof HEADING_FONTS)[number];
export type BodyFont = (typeof BODY_FONTS)[number];

// =====================================================
// Rendering Types
// =====================================================

/**
 * Props passed to section components for rendering
 */
export interface SectionRenderProps<T extends SectionType = SectionType> {
  /** The section type being rendered */
  type: T;
  /** Section configuration including visibility, variant, and content */
  config: import("@/lib/db/schema").SectionConfig;
  /** Resolved theme (template defaults merged with user overrides) */
  theme: ResolvedTheme;
  /** User data for the portfolio owner */
  user: import("@/lib/db/schema").User;
  /** Portfolio projects (for Work section) */
  projects?: import("@/lib/db/schema").PortfolioProject[];
  /** Media lookup map (mediaId -> Media) */
  mediaMap?: Map<string, import("@/lib/db/schema").Media>;
}

/**
 * Fully resolved theme with all values (no optional fields)
 */
export interface ResolvedTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      inverse: string;
    };
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
    scale: number;
  };
  spacing: {
    sectionGap: "compact" | "normal" | "spacious";
    contentWidth: "narrow" | "normal" | "wide" | "full";
  };
  effects: {
    borderRadius: "none" | "subtle" | "rounded" | "pill";
    shadows: "none" | "subtle" | "medium" | "dramatic";
    animations: boolean;
  };
}

/**
 * Template metadata returned by the registry
 */
export interface TemplateMetadata {
  slug: string;
  name: string;
  description: string;
  previewImageUrl?: string;
  availableSections: SectionType[];
  defaultSectionOrder: SectionType[];
  themeDefaults: ResolvedTheme;
}

/**
 * Data needed to render a complete portfolio
 */
export interface PortfolioRenderData {
  user: import("@/lib/db/schema").User;
  config: import("@/lib/db/schema").PortfolioConfig;
  template: import("@/lib/db/schema").Template;
  theme: ResolvedTheme;
  projects: import("@/lib/db/schema").PortfolioProject[];
  mediaMap: Map<string, import("@/lib/db/schema").Media>;
}
