/**
 * Portfolio Templates Module
 *
 * Entry point for all template-related functionality.
 */

// Types
export * from "./types";

// Registry
export {
  // Constants
  BASE_THEME_DEFAULTS,
  // Template lookup
  getTemplateMetadata,
  getAllTemplates,
  getTemplateSlugs,
  isValidTemplateSlug,
  // Theme utilities
  resolveTheme,
  resolveThemeFromTemplate,
  themeToCssVariables,
  // Section utilities
  getDefaultSectionOrder,
  getAvailableSections,
} from "./registry";

// Renderer
export { PortfolioRenderer } from "./render";
export type { PortfolioRenderProps } from "./render";

// Queries
export {
  getPortfolioData,
  getPortfolioDataBySubdomain,
  hasPublishedPortfolio,
} from "./queries";
export type { PortfolioData } from "./queries";

// Sections
export * from "./sections";
