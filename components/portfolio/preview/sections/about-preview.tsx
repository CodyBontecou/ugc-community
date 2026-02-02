"use client";

/**
 * About Section Preview Component
 */

import type { Media, User } from "@/lib/db/schema";

export interface AboutPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
  user: User;
  mediaMap?: Map<string, Media>;
}

export function AboutPreview({ variant = "default", content, user, mediaMap }: AboutPreviewProps) {
  const title = (content?.title as string) || "About Me";
  const bio = (content?.bio as string) || user.bio || "Tell visitors about yourself, your experience, and what makes you unique.";
  const profileMediaId = content?.profileMediaId as string | undefined;
  const profileMedia = profileMediaId ? mediaMap?.get(profileMediaId) : undefined;

  const userImage = profileMedia?.url || user.image;

  // With Stats variant
  if (variant === "with-stats") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <div>
              {userImage && (
                <img
                  src={userImage}
                  alt=""
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: "var(--border-radius)",
                    boxShadow: "var(--shadow)",
                  }}
                />
              )}
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 600,
                  marginBottom: "1.5rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {title}
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.1rem",
                  lineHeight: 1.8,
                  color: "var(--color-text-secondary)",
                  whiteSpace: "pre-line",
                }}
              >
                {bio}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "2rem",
                  marginTop: "2rem",
                  paddingTop: "2rem",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-accent)" }}>50+</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Projects</div>
                </div>
                <div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-accent)" }}>3+</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Years</div>
                </div>
                <div>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-accent)" }}>100%</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Centered variant
  if (variant === "centered") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {userImage && (
            <img
              src={userImage}
              alt=""
              style={{
                width: "150px",
                height: "150px",
                objectFit: "cover",
                borderRadius: "50%",
                margin: "0 auto 2rem",
                boxShadow: "var(--shadow)",
              }}
            />
          )}
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "1.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              color: "var(--color-text-secondary)",
              whiteSpace: "pre-line",
            }}
          >
            {bio}
          </p>
        </div>
      </section>
    );
  }

  // Default variant
  return (
    <section
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: userImage ? "300px 1fr" : "1fr",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        {userImage && (
          <img
            src={userImage}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              borderRadius: "var(--border-radius)",
              boxShadow: "var(--shadow)",
            }}
          />
        )}
        <div>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "1.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.1rem",
              lineHeight: 1.8,
              color: "var(--color-text-secondary)",
              whiteSpace: "pre-line",
            }}
          >
            {bio}
          </p>
        </div>
      </div>
    </section>
  );
}
