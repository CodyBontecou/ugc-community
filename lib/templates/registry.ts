/**
 * Template Registry
 *
 * Maps template slugs to metadata and provides theme merging utilities.
 */

import type {
  ResolvedTheme,
  TemplateMetadata,
  SectionType,
} from "./types";
import type { ThemeConfig, Template } from "@/lib/db/schema";

// =====================================================
// Default Theme Values
// =====================================================

/**
 * Base theme defaults applied to all templates
 */
export const BASE_THEME_DEFAULTS: ResolvedTheme = {
  colors: {
    primary: "#000000",
    secondary: "#4A5568",
    accent: "#3182CE",
    background: "#FFFFFF",
    surface: "#F7FAFC",
    text: {
      primary: "#1A202C",
      secondary: "#718096",
      inverse: "#FFFFFF",
    },
    border: "#E2E8F0",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseSize: 16,
    scale: 1.25,
  },
  spacing: {
    sectionGap: "normal",
    contentWidth: "normal",
  },
  effects: {
    borderRadius: "subtle",
    shadows: "subtle",
    animations: true,
  },
};

// =====================================================
// Template Theme Presets
// =====================================================

const MINIMAL_THEME: ResolvedTheme = {
  colors: {
    primary: "#000000",
    secondary: "#6B7280",
    accent: "#000000",
    background: "#FFFFFF",
    surface: "#FAFAFA",
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      inverse: "#FFFFFF",
    },
    border: "#E5E7EB",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseSize: 16,
    scale: 1.2,
  },
  spacing: {
    sectionGap: "spacious",
    contentWidth: "narrow",
  },
  effects: {
    borderRadius: "subtle",
    shadows: "none",
    animations: true,
  },
};

const BOLD_THEME: ResolvedTheme = {
  colors: {
    primary: "#FFFFFF",
    secondary: "#A0AEC0",
    accent: "#F56565",
    background: "#0D0D0D",
    surface: "#1A1A1A",
    text: {
      primary: "#FFFFFF",
      secondary: "#A0AEC0",
      inverse: "#000000",
    },
    border: "#2D2D2D",
  },
  typography: {
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    baseSize: 18,
    scale: 1.5,
  },
  spacing: {
    sectionGap: "normal",
    contentWidth: "wide",
  },
  effects: {
    borderRadius: "none",
    shadows: "dramatic",
    animations: true,
  },
};

const ELEGANT_THEME: ResolvedTheme = {
  colors: {
    primary: "#1F2937",
    secondary: "#6B7280",
    accent: "#B45309",
    background: "#FFFBF5",
    surface: "#FFF7ED",
    text: {
      primary: "#1F2937",
      secondary: "#6B7280",
      inverse: "#FFFBF5",
    },
    border: "#E5E0DB",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Lato",
    baseSize: 17,
    scale: 1.333,
  },
  spacing: {
    sectionGap: "spacious",
    contentWidth: "normal",
  },
  effects: {
    borderRadius: "subtle",
    shadows: "subtle",
    animations: true,
  },
};

// =====================================================
// Template Registry
// =====================================================

const ALL_SECTIONS: SectionType[] = [
  "hero",
  "about",
  "work",
  "services",
  "testimonials",
  "stats",
  "contact",
];

const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  minimal: {
    slug: "minimal",
    name: "Minimal",
    description: "Clean, lots of whitespace, typography-focused. Best for creators who want content to speak for itself.",
    availableSections: ALL_SECTIONS,
    defaultSectionOrder: ["hero", "about", "work", "contact"],
    themeDefaults: MINIMAL_THEME,
  },
  bold: {
    slug: "bold",
    name: "Bold",
    description: "High contrast, large imagery, impactful. Best for creators with strong visual content.",
    availableSections: ALL_SECTIONS,
    defaultSectionOrder: ["hero", "work", "about", "stats", "contact"],
    themeDefaults: BOLD_THEME,
  },
  elegant: {
    slug: "elegant",
    name: "Elegant",
    description: "Sophisticated, refined, editorial. Best for luxury/beauty/lifestyle creators.",
    availableSections: ALL_SECTIONS,
    defaultSectionOrder: ["hero", "about", "work", "testimonials", "contact"],
    themeDefaults: ELEGANT_THEME,
  },
};

// =====================================================
// Registry Functions
// =====================================================

/**
 * Get template metadata by slug
 */
export function getTemplateMetadata(slug: string): TemplateMetadata | null {
  return TEMPLATE_REGISTRY[slug] ?? null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): TemplateMetadata[] {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Get all template slugs
 */
export function getTemplateSlugs(): string[] {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Check if a template slug exists
 */
export function isValidTemplateSlug(slug: string): boolean {
  return slug in TEMPLATE_REGISTRY;
}

// =====================================================
// Theme Utilities
// =====================================================

/**
 * Deep merge theme objects, with source overwriting target
 */
function mergeTheme(
  target: ResolvedTheme,
  source: Partial<ResolvedTheme>
): ResolvedTheme {
  return {
    colors: {
      primary: source.colors?.primary ?? target.colors.primary,
      secondary: source.colors?.secondary ?? target.colors.secondary,
      accent: source.colors?.accent ?? target.colors.accent,
      background: source.colors?.background ?? target.colors.background,
      surface: source.colors?.surface ?? target.colors.surface,
      text: {
        primary: source.colors?.text?.primary ?? target.colors.text.primary,
        secondary: source.colors?.text?.secondary ?? target.colors.text.secondary,
        inverse: source.colors?.text?.inverse ?? target.colors.text.inverse,
      },
      border: source.colors?.border ?? target.colors.border,
    },
    typography: {
      headingFont: source.typography?.headingFont ?? target.typography.headingFont,
      bodyFont: source.typography?.bodyFont ?? target.typography.bodyFont,
      baseSize: source.typography?.baseSize ?? target.typography.baseSize,
      scale: source.typography?.scale ?? target.typography.scale,
    },
    spacing: {
      sectionGap: source.spacing?.sectionGap ?? target.spacing.sectionGap,
      contentWidth: source.spacing?.contentWidth ?? target.spacing.contentWidth,
    },
    effects: {
      borderRadius: source.effects?.borderRadius ?? target.effects.borderRadius,
      shadows: source.effects?.shadows ?? target.effects.shadows,
      animations: source.effects?.animations ?? target.effects.animations,
    },
  };
}

/**
 * Get resolved theme by merging:
 * 1. Base defaults
 * 2. Template defaults
 * 3. User overrides
 */
export function resolveTheme(
  templateSlug: string,
  userOverrides?: Partial<ThemeConfig>
): ResolvedTheme {
  // Start with base defaults
  let theme: ResolvedTheme = { ...BASE_THEME_DEFAULTS };

  // Apply template defaults
  const templateMeta = getTemplateMetadata(templateSlug);
  if (templateMeta) {
    theme = mergeTheme(theme, templateMeta.themeDefaults);
  }

  // Apply user overrides
  if (userOverrides) {
    theme = mergeTheme(theme, userOverrides as Partial<ResolvedTheme>);
  }

  return theme;
}

/**
 * Resolve theme from a database Template record
 */
export function resolveThemeFromTemplate(
  template: Template,
  userOverrides?: Partial<ThemeConfig>
): ResolvedTheme {
  // Start with base defaults
  let theme: ResolvedTheme = { ...BASE_THEME_DEFAULTS };

  // Apply template's stored defaults (from DB)
  if (template.themeDefaults) {
    theme = mergeTheme(theme, template.themeDefaults as Partial<ResolvedTheme>);
  }

  // Fall back to registry defaults if DB is sparse
  const registryMeta = getTemplateMetadata(template.slug);
  if (registryMeta) {
    theme = mergeTheme(theme, registryMeta.themeDefaults);
  }

  // Apply user overrides
  if (userOverrides) {
    theme = mergeTheme(theme, userOverrides as Partial<ResolvedTheme>);
  }

  return theme;
}

/**
 * Convert theme to CSS custom properties
 */
export function themeToCssVariables(theme: ResolvedTheme): Record<string, string> {
  return {
    // Colors
    "--color-primary": theme.colors.primary,
    "--color-secondary": theme.colors.secondary,
    "--color-accent": theme.colors.accent,
    "--color-background": theme.colors.background,
    "--color-surface": theme.colors.surface,
    "--color-text-primary": theme.colors.text.primary,
    "--color-text-secondary": theme.colors.text.secondary,
    "--color-text-inverse": theme.colors.text.inverse,
    "--color-border": theme.colors.border,

    // Typography
    "--font-heading": theme.typography.headingFont,
    "--font-body": theme.typography.bodyFont,
    "--font-size-base": `${theme.typography.baseSize}px`,
    "--font-scale": theme.typography.scale.toString(),

    // Spacing
    "--section-gap": spacingGapToValue(theme.spacing.sectionGap),
    "--content-width": contentWidthToValue(theme.spacing.contentWidth),

    // Effects
    "--border-radius": borderRadiusToValue(theme.effects.borderRadius),
    "--shadow": shadowToValue(theme.effects.shadows),
  };
}

/**
 * Convert spacing gap option to CSS value
 */
function spacingGapToValue(gap: ResolvedTheme["spacing"]["sectionGap"]): string {
  switch (gap) {
    case "compact":
      return "3rem";
    case "normal":
      return "5rem";
    case "spacious":
      return "8rem";
    default:
      return "5rem";
  }
}

/**
 * Convert content width option to CSS value
 */
function contentWidthToValue(width: ResolvedTheme["spacing"]["contentWidth"]): string {
  switch (width) {
    case "narrow":
      return "768px";
    case "normal":
      return "1024px";
    case "wide":
      return "1280px";
    case "full":
      return "100%";
    default:
      return "1024px";
  }
}

/**
 * Convert border radius option to CSS value
 */
function borderRadiusToValue(radius: ResolvedTheme["effects"]["borderRadius"]): string {
  switch (radius) {
    case "none":
      return "0";
    case "subtle":
      return "0.375rem";
    case "rounded":
      return "0.75rem";
    case "pill":
      return "9999px";
    default:
      return "0.375rem";
  }
}

/**
 * Convert shadow option to CSS value
 */
function shadowToValue(shadow: ResolvedTheme["effects"]["shadows"]): string {
  switch (shadow) {
    case "none":
      return "none";
    case "subtle":
      return "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)";
    case "medium":
      return "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
    case "dramatic":
      return "0 25px 50px -12px rgb(0 0 0 / 0.25)";
    default:
      return "none";
  }
}

/**
 * Get the default section order for a template
 */
export function getDefaultSectionOrder(templateSlug: string): SectionType[] {
  const meta = getTemplateMetadata(templateSlug);
  return meta?.defaultSectionOrder ?? ["hero", "about", "work", "contact"];
}

/**
 * Get available sections for a template
 */
export function getAvailableSections(templateSlug: string): SectionType[] {
  const meta = getTemplateMetadata(templateSlug);
  return meta?.availableSections ?? ALL_SECTIONS;
}
