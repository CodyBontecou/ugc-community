"use client";

/**
 * Work Section Preview Component
 */

import type { PortfolioProject, Media } from "@/lib/db/schema";

export interface ProjectWithMedia extends PortfolioProject {
  coverMedia: Media | null;
}

export interface WorkPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
  projects: ProjectWithMedia[];
}

export function WorkPreview({ variant = "grid", content, projects }: WorkPreviewProps) {
  const title = (content?.title as string) || "My Work";
  const subtitle = (content?.subtitle as string) || "A selection of my recent projects";

  // Use actual projects or show placeholder
  const displayProjects: Array<{ id: string; title: string; campaignDescription?: string | null; coverMedia: Media | null }> = 
    projects.length > 0 
      ? projects.slice(0, 6).map(p => ({ id: p.id, title: p.title, campaignDescription: p.campaignDescription, coverMedia: p.coverMedia }))
      : [
          { id: "1", title: "Project One", campaignDescription: "Sample project description", coverMedia: null },
          { id: "2", title: "Project Two", campaignDescription: "Sample project description", coverMedia: null },
          { id: "3", title: "Project Three", campaignDescription: "Sample project description", coverMedia: null },
        ];

  // Featured variant
  if (variant === "featured") {
    const featured = displayProjects[0];
    const rest = displayProjects.slice(1, 5);

    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem" }}>
              {subtitle}
            </p>
          )}

          {/* Featured Project */}
          {featured && (
            <div
              style={{
                marginBottom: "2rem",
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--border-radius)",
                overflow: "hidden",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{
                  height: "400px",
                  backgroundColor: "var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {featured.coverMedia ? (
                  <img
                    src={featured.coverMedia.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "var(--color-text-secondary)" }}>Featured Project</span>
                )}
              </div>
              <div style={{ padding: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                  {featured.title}
                </h3>
                {featured.campaignDescription && (
                  <p style={{ color: "var(--color-text-secondary)" }}>{featured.campaignDescription}</p>
                )}
              </div>
            </div>
          )}

          {/* Rest of projects */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {rest.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // List variant
  if (variant === "list") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "3rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {displayProjects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2rem",
                  padding: "1.5rem",
                  borderBottom: index < displayProjects.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <span style={{ fontSize: "1.25rem", color: "var(--color-text-secondary)", minWidth: "2rem" }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>{project.title}</h3>
                  {project.campaignDescription && (
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                      {project.campaignDescription}
                    </p>
                  )}
                </div>
                <span style={{ color: "var(--color-accent)" }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: Grid variant
  return (
    <section
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto" }}>
              {subtitle}
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {displayProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: { id: string; title: string; campaignDescription?: string | null; coverMedia: Media | null } }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--border-radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
        transition: "transform 0.2s ease",
      }}
    >
      <div
        style={{
          aspectRatio: "16/10",
          backgroundColor: "var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {project.coverMedia ? (
          <img
            src={project.coverMedia.url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
            No image
          </span>
        )}
      </div>
      <div style={{ padding: "1.25rem" }}>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--color-text-primary)",
          }}
        >
          {project.title}
        </h3>
        {project.campaignDescription && (
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.5,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {project.campaignDescription}
          </p>
        )}
      </div>
    </div>
  );
}
