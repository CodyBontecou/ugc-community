/**
 * Work/Portfolio Section Component
 *
 * Displays portfolio projects from the portfolioProjects table.
 *
 * Variants:
 * - grid: Equal-size grid cards
 * - masonry: Pinterest-style varied heights
 * - carousel: Horizontal scroll/swipe
 * - featured: One large + smaller grid
 * - list: Vertical list with details
 */

"use client";

import { useState, useMemo } from "react";
import type { SectionContent, PortfolioProject, Media } from "@/lib/db/schema";
import type { WorkVariant } from "../types";

/**
 * Project with its cover media resolved
 */
export interface ProjectWithMedia extends PortfolioProject {
  coverMedia?: Media | null;
}

export interface WorkProps {
  variant?: WorkVariant;
  content?: SectionContent;
  projects?: ProjectWithMedia[];
}

export function Work({ variant = "grid", content, projects = [] }: WorkProps) {
  const {
    title = "My Work",
    subtitle,
    showFilters,
    maxItems,
    projectIds,
  } = content ?? {};

  // Filter projects by specific IDs if provided
  const filteredByIds = useMemo(() => {
    if (projectIds && projectIds.length > 0) {
      const idSet = new Set(projectIds);
      return projects.filter((p) => idSet.has(p.id));
    }
    return projects;
  }, [projects, projectIds]);

  // Apply max items limit
  const limitedProjects = useMemo(() => {
    if (maxItems && maxItems > 0) {
      return filteredByIds.slice(0, maxItems);
    }
    return filteredByIds;
  }, [filteredByIds, maxItems]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const contentTypes = new Set<string>();
    const platforms = new Set<string>();

    filteredByIds.forEach((p) => {
      if (p.contentType) contentTypes.add(p.contentType);
      if (p.platforms) p.platforms.forEach((pl) => platforms.add(pl));
    });

    return {
      contentTypes: Array.from(contentTypes),
      platforms: Array.from(platforms),
    };
  }, [filteredByIds]);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Apply user filter
  const displayProjects = useMemo(() => {
    if (!activeFilter) return limitedProjects;

    return limitedProjects.filter(
      (p) =>
        p.contentType === activeFilter ||
        (p.platforms && p.platforms.includes(activeFilter))
    );
  }, [limitedProjects, activeFilter]);

  return (
    <section
      className="work"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          {title && (
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                fontWeight: 600,
                marginBottom: subtitle ? "0.75rem" : 0,
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-secondary)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Filters */}
        {showFilters && (filterOptions.contentTypes.length > 0 || filterOptions.platforms.length > 0) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "2rem",
            }}
          >
            <FilterButton
              label="All"
              active={activeFilter === null}
              onClick={() => setActiveFilter(null)}
            />
            {filterOptions.contentTypes.map((type) => (
              <FilterButton
                key={type}
                label={formatFilterLabel(type)}
                active={activeFilter === type}
                onClick={() => setActiveFilter(type)}
              />
            ))}
            {filterOptions.platforms.map((platform) => (
              <FilterButton
                key={platform}
                label={formatFilterLabel(platform)}
                active={activeFilter === platform}
                onClick={() => setActiveFilter(platform)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {displayProjects.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "var(--color-text-secondary)",
            }}
          >
            <p>No projects to display yet.</p>
          </div>
        )}

        {/* Projects Display */}
        {displayProjects.length > 0 && (
          <>
            {variant === "grid" && <WorkGrid projects={displayProjects} />}
            {variant === "masonry" && <WorkMasonry projects={displayProjects} />}
            {variant === "carousel" && <WorkCarousel projects={displayProjects} />}
            {variant === "featured" && <WorkFeatured projects={displayProjects} />}
            {variant === "list" && <WorkList projects={displayProjects} />}
          </>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Filter Button
// =====================================================

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        fontFamily: "var(--font-body)",
        fontSize: "0.875rem",
        backgroundColor: active ? "var(--color-accent)" : "transparent",
        color: active ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        borderRadius: "var(--border-radius)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {label}
    </button>
  );
}

function formatFilterLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// =====================================================
// Variant: Grid
// =====================================================

function WorkGrid({ projects }: { projects: ProjectWithMedia[] }) {
  return (
    <div
      className="work-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// =====================================================
// Variant: Masonry
// =====================================================

function WorkMasonry({ projects }: { projects: ProjectWithMedia[] }) {
  // CSS columns-based masonry
  return (
    <div
      className="work-masonry"
      style={{
        columnCount: 3,
        columnGap: "1.5rem",
      }}
    >
      <style>{`
        @media (max-width: 1024px) {
          .work-masonry { column-count: 2 !important; }
        }
        @media (max-width: 640px) {
          .work-masonry { column-count: 1 !important; }
        }
      `}</style>
      {projects.map((project, i) => (
        <div
          key={project.id}
          style={{
            breakInside: "avoid",
            marginBottom: "1.5rem",
          }}
        >
          <ProjectCard project={project} aspectRatio={i % 3 === 0 ? "4/5" : "1"} />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Carousel
// =====================================================

function WorkCarousel({ projects }: { projects: ProjectWithMedia[] }) {
  return (
    <div
      className="work-carousel"
      style={{
        display: "flex",
        gap: "1.5rem",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        paddingBottom: "1rem",
        marginLeft: "-2rem",
        marginRight: "-2rem",
        paddingLeft: "2rem",
        paddingRight: "2rem",
      }}
    >
      <style>{`
        .work-carousel::-webkit-scrollbar {
          height: 6px;
        }
        .work-carousel::-webkit-scrollbar-track {
          background: var(--color-border);
          border-radius: 3px;
        }
        .work-carousel::-webkit-scrollbar-thumb {
          background: var(--color-text-secondary);
          border-radius: 3px;
        }
      `}</style>
      {projects.map((project) => (
        <div
          key={project.id}
          style={{
            flexShrink: 0,
            width: "350px",
            scrollSnapAlign: "start",
          }}
        >
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Featured
// =====================================================

function WorkFeatured({ projects }: { projects: ProjectWithMedia[] }) {
  const [featured, ...rest] = projects;

  if (!featured) return null;

  return (
    <div className="work-featured">
      {/* Featured Project */}
      <div style={{ marginBottom: "1.5rem" }}>
        <ProjectCard project={featured} large />
      </div>

      {/* Grid of remaining */}
      {rest.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {rest.map((project) => (
            <ProjectCard key={project.id} project={project} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// Variant: List
// =====================================================

function WorkList({ projects }: { projects: ProjectWithMedia[] }) {
  return (
    <div
      className="work-list"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      {projects.map((project) => (
        <ProjectListItem key={project.id} project={project} />
      ))}
    </div>
  );
}

// =====================================================
// Project Card (for Grid, Masonry, Carousel, Featured)
// =====================================================

interface ProjectCardProps {
  project: ProjectWithMedia;
  large?: boolean;
  compact?: boolean;
  aspectRatio?: string;
}

function ProjectCard({ project, large, compact, aspectRatio = "4/3" }: ProjectCardProps) {
  const coverUrl = project.coverMedia?.url;
  const isVideo = project.coverMedia?.type === "video";

  return (
    <div
      className="project-card"
      style={{
        backgroundColor: "var(--color-background)",
        borderRadius: "var(--border-radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <style>{`
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }
      `}</style>
      
      {/* Media */}
      <div
        style={{
          aspectRatio: large ? "16/9" : aspectRatio,
          backgroundColor: "var(--color-surface)",
          overflow: "hidden",
        }}
      >
        {coverUrl ? (
          isVideo ? (
            <video
              src={coverUrl}
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <img
              src={coverUrl}
              alt={project.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <span>No media</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: compact ? "1rem" : "1.25rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: large
              ? `calc(var(--font-size-base) * var(--font-scale))`
              : "var(--font-size-base)",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--color-text-primary)",
          }}
        >
          {project.title}
        </h3>

        {project.brandName && !compact && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
            }}
          >
            {project.brandName}
          </p>
        )}

        {/* Platforms */}
        {project.platforms && project.platforms.length > 0 && !compact && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            {project.platforms.map((platform) => (
              <span
                key={platform}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "var(--border-radius)",
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  textTransform: "capitalize",
                }}
              >
                {platform}
              </span>
            ))}
          </div>
        )}

        {/* Results (for large cards) */}
        {large && project.results && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--color-accent)",
              marginTop: "0.75rem",
              fontWeight: 500,
            }}
          >
            {project.results}
          </p>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Project List Item (for List variant)
// =====================================================

function ProjectListItem({ project }: { project: ProjectWithMedia }) {
  const coverUrl = project.coverMedia?.url;

  return (
    <div
      className="project-list-item"
      style={{
        display: "grid",
        gridTemplateColumns: coverUrl ? "200px 1fr" : "1fr",
        gap: "1.5rem",
        padding: "1.5rem",
        backgroundColor: "var(--color-background)",
        borderRadius: "var(--border-radius)",
        boxShadow: "var(--shadow)",
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .project-list-item {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Thumbnail */}
      {coverUrl && (
        <div
          style={{
            aspectRatio: "4/3",
            borderRadius: "var(--border-radius)",
            overflow: "hidden",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <img
            src={coverUrl}
            alt={project.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Details */}
      <div>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--color-text-primary)",
          }}
        >
          {project.title}
        </h3>

        {project.brandName && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              color: "var(--color-accent)",
              marginBottom: "0.75rem",
              fontWeight: 500,
            }}
          >
            {project.brandName}
          </p>
        )}

        {project.campaignDescription && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--font-size-base)",
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
              marginBottom: "1rem",
            }}
          >
            {project.campaignDescription}
          </p>
        )}

        {/* Meta */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {project.platforms && project.platforms.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {project.platforms.map((platform) => (
                <span
                  key={platform}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "var(--border-radius)",
                    fontSize: "0.75rem",
                    color: "var(--color-text-secondary)",
                    textTransform: "capitalize",
                  }}
                >
                  {platform}
                </span>
              ))}
            </div>
          )}

          {project.results && (
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              📊 {project.results}
            </span>
          )}

          {project.contentType && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {formatFilterLabel(project.contentType)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Work;
