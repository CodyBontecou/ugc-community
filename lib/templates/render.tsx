/**
 * Portfolio Template Renderer
 *
 * Server component that renders a complete portfolio from config.
 */

import { Hero, About, Work, Contact } from "./sections";
import type { ProjectWithMedia } from "./sections";
import {
  resolveThemeFromTemplate,
  themeToCssVariables,
} from "./registry";
import type {
  PortfolioConfig,
  Template,
  User,
  Media,
  PortfolioProject,
  SectionConfig,
  SectionType,
} from "./types";

// =====================================================
// Types
// =====================================================

export interface PortfolioRenderProps {
  user: User;
  config: PortfolioConfig;
  template: Template;
  projects: PortfolioProject[];
  projectCoverMedia: Map<string, Media>;
  mediaMap: Map<string, Media>;
  isOwnerPreview?: boolean;
}

// =====================================================
// Main Renderer
// =====================================================

export function PortfolioRenderer({
  user,
  config,
  template,
  projects,
  projectCoverMedia,
  mediaMap,
  isOwnerPreview,
}: PortfolioRenderProps) {
  // Resolve theme with user overrides
  const theme = resolveThemeFromTemplate(template, config.theme);
  const cssVariables = themeToCssVariables(theme);

  // Get section order (from config, or template defaults, or fallback)
  const sectionOrder = getSectionOrder(config, template);

  // Build projects with cover media
  const projectsWithMedia: ProjectWithMedia[] = projects.map((p) => ({
    ...p,
    coverMedia: projectCoverMedia.get(p.id) ?? null,
  }));

  // Google Fonts to load
  const fontsToLoad = [theme.typography.headingFont, theme.typography.bodyFont];
  const uniqueFonts = [...new Set(fontsToLoad)];

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href={`https://fonts.googleapis.com/css2?${uniqueFonts
          .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
          .join("&")}&display=swap`}
        rel="stylesheet"
      />

      {/* Draft Indicator for Owner */}
      {isOwnerPreview && !config.isPublished && (
        <div
          style={{
            position: "fixed",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          📝 Draft Preview – Only you can see this
        </div>
      )}

      {/* Portfolio Container */}
      <div
        className="portfolio-template"
        style={{
          ...cssVariables,
          minHeight: "100vh",
          backgroundColor: "var(--color-background)",
          fontFamily: "var(--font-body)",
          color: "var(--color-text-primary)",
        } as React.CSSProperties}
      >
        {sectionOrder.map((sectionType) => {
          const sectionConfig = getSectionConfig(config, sectionType);

          // Skip hidden sections
          if (sectionConfig?.visible === false) {
            return null;
          }

          return (
            <SectionRenderer
              key={sectionType}
              type={sectionType}
              config={sectionConfig}
              user={user}
              projects={projectsWithMedia}
              mediaMap={mediaMap}
            />
          );
        })}
      </div>
    </>
  );
}

// =====================================================
// Section Renderer
// =====================================================

interface SectionRendererProps {
  type: SectionType;
  config?: SectionConfig;
  user: User;
  projects: ProjectWithMedia[];
  mediaMap: Map<string, Media>;
}

function SectionRenderer({
  type,
  config,
  user,
  projects,
  mediaMap,
}: SectionRendererProps) {
  const variant = config?.variant;
  const content = config?.content;

  switch (type) {
    case "hero":
      return (
        <Hero
          variant={variant as Parameters<typeof Hero>[0]["variant"]}
          content={content}
          mediaMap={mediaMap}
        />
      );

    case "about":
      return (
        <About
          variant={variant as Parameters<typeof About>[0]["variant"]}
          content={content}
          user={user}
          mediaMap={mediaMap}
        />
      );

    case "work":
      return (
        <Work
          variant={variant as Parameters<typeof Work>[0]["variant"]}
          content={content}
          projects={projects}
        />
      );

    case "contact":
      return (
        <Contact
          variant={variant as Parameters<typeof Contact>[0]["variant"]}
          content={content}
          user={user}
        />
      );

    // Services, Testimonials, Stats - Coming soon
    case "services":
    case "testimonials":
    case "stats":
      return (
        <PlaceholderSection type={type} />
      );

    default:
      return null;
  }
}

// =====================================================
// Placeholder for unimplemented sections
// =====================================================

function PlaceholderSection({ type }: { type: string }) {
  return (
    <section
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "3rem",
          border: `2px dashed var(--color-border)`,
          borderRadius: "var(--border-radius)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p style={{ fontFamily: "var(--font-body)" }}>
          {type.charAt(0).toUpperCase() + type.slice(1)} section coming soon
        </p>
      </div>
    </section>
  );
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get section order from config, falling back to template defaults
 */
function getSectionOrder(config: PortfolioConfig, template: Template): SectionType[] {
  // Try config's section order
  if (config.sections?.order && config.sections.order.length > 0) {
    return config.sections.order as SectionType[];
  }

  // Try template's default order
  if (template.sectionDefaults?.order && template.sectionDefaults.order.length > 0) {
    return template.sectionDefaults.order as SectionType[];
  }

  // Fallback default
  return ["hero", "about", "work", "contact"];
}

/**
 * Get section config, merging template defaults with user config
 */
function getSectionConfig(config: PortfolioConfig, type: SectionType): SectionConfig | undefined {
  const userConfig = config.sections?.[type];

  // If user has explicit config, use it
  if (userConfig) {
    return userConfig;
  }

  // Return undefined to use component defaults
  return undefined;
}

export default PortfolioRenderer;
