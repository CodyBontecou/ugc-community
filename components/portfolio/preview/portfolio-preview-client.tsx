"use client";

/**
 * Client-side Portfolio Preview Renderer
 *
 * A client component that renders the portfolio preview with live updates.
 * This mirrors the server-side PortfolioRenderer but works on the client.
 */

import { useMemo } from "react";
import type {
  PortfolioConfig,
  Template,
  PortfolioProject,
  Media,
  User,
} from "@/lib/db/schema";
import { resolveThemeFromTemplate, themeToCssVariables } from "@/lib/templates/registry";
import type { SectionType } from "@/lib/templates/types";

// Import section components
import {
  HeroPreview,
  AboutPreview,
  WorkPreview,
  ContactPreview,
  ServicesPreview,
  TestimonialsPreview,
  StatsPreview,
} from "./sections";

export interface ProjectWithMedia extends PortfolioProject {
  coverMedia: Media | null;
}

export interface PortfolioPreviewClientProps {
  user: User;
  config: PortfolioConfig;
  template: Template;
  projects: ProjectWithMedia[];
  mediaMap: Record<string, Media>;
  scale?: number;
}

export function PortfolioPreviewClient({
  user,
  config,
  template,
  projects,
  mediaMap,
  scale = 1,
}: PortfolioPreviewClientProps) {
  // Resolve theme with user overrides
  const theme = useMemo(
    () => resolveThemeFromTemplate(template, config.theme),
    [template, config.theme]
  );
  const cssVariables = useMemo(() => themeToCssVariables(theme), [theme]);

  // Get section order (from config, or template defaults, or fallback)
  const sectionOrder = useMemo(() => {
    if (config.sections?.order && config.sections.order.length > 0) {
      return config.sections.order as SectionType[];
    }
    if (template.sectionDefaults?.order && template.sectionDefaults.order.length > 0) {
      return template.sectionDefaults.order as SectionType[];
    }
    return ["hero", "about", "work", "contact"] as SectionType[];
  }, [config.sections?.order, template.sectionDefaults?.order]);

  // Google Fonts to load
  const uniqueFonts = useMemo(() => {
    const fontsToLoad = [theme.typography.headingFont, theme.typography.bodyFont];
    return [...new Set(fontsToLoad)];
  }, [theme.typography.headingFont, theme.typography.bodyFont]);

  // Convert mediaMap object to Map for section components
  const mediaMapObj = useMemo(() => new Map(Object.entries(mediaMap)), [mediaMap]);

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

      {/* Portfolio Container */}
      <div
        className="portfolio-preview"
        style={{
          ...cssVariables,
          minHeight: "100%",
          backgroundColor: "var(--color-background)",
          fontFamily: "var(--font-body)",
          color: "var(--color-text-primary)",
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        } as React.CSSProperties}
      >
        {sectionOrder.map((sectionType) => {
          const sectionConfig = config.sections?.[sectionType];

          // Skip hidden sections
          if (sectionConfig?.visible === false) {
            return null;
          }

          return (
            <SectionPreviewRenderer
              key={sectionType}
              type={sectionType}
              config={sectionConfig}
              user={user}
              projects={projects}
              mediaMap={mediaMapObj}
            />
          );
        })}
      </div>
    </>
  );
}

// =====================================================
// Section Preview Renderer
// =====================================================

interface SectionPreviewRendererProps {
  type: SectionType;
  config?: { visible?: boolean; variant?: string; content?: Record<string, unknown> };
  user: User;
  projects: ProjectWithMedia[];
  mediaMap: Map<string, Media>;
}

function SectionPreviewRenderer({
  type,
  config,
  user,
  projects,
  mediaMap,
}: SectionPreviewRendererProps) {
  const variant = config?.variant;
  const content = config?.content;

  switch (type) {
    case "hero":
      return <HeroPreview variant={variant} content={content} mediaMap={mediaMap} />;

    case "about":
      return <AboutPreview variant={variant} content={content} user={user} mediaMap={mediaMap} />;

    case "work":
      return <WorkPreview variant={variant} content={content} projects={projects} />;

    case "contact":
      return <ContactPreview variant={variant} content={content} user={user} />;

    case "services":
      return <ServicesPreview variant={variant} content={content} />;

    case "testimonials":
      return <TestimonialsPreview variant={variant} content={content} mediaMap={mediaMap} />;

    case "stats":
      return <StatsPreview variant={variant} content={content} />;

    default:
      return null;
  }
}

export default PortfolioPreviewClient;
