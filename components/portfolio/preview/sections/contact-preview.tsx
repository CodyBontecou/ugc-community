"use client";

/**
 * Contact Section Preview Component
 */

import type { User } from "@/lib/db/schema";

export interface ContactPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
  user: User;
}

export function ContactPreview({ variant = "simple", content, user }: ContactPreviewProps) {
  const title = (content?.title as string) || "Get in Touch";
  const subtitle = (content?.subtitle as string) || "Ready to work together? Let's talk about your next project.";
  const email = (content?.email as string) || user.email;
  const ctaText = (content?.ctaText as string) || "Send Message";

  // CTA variant
  if (variant === "cta") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-text-inverse)",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              opacity: 0.9,
              marginBottom: "2rem",
            }}
          >
            {subtitle}
          </p>
          <button
            style={{
              padding: "1rem 2.5rem",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              border: "none",
              borderRadius: "var(--border-radius)",
              fontWeight: 600,
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            {ctaText}
          </button>
        </div>
      </section>
    );
  }

  // Form variant
  if (variant === "form") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "0.5rem",
              color: "var(--color-text-primary)",
              textAlign: "center",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            {subtitle}
          </p>

          <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Name"
                disabled
                style={{
                  padding: "0.875rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: "var(--color-background)",
                }}
              />
              <input
                type="email"
                placeholder="Email"
                disabled
                style={{
                  padding: "0.875rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: "var(--color-background)",
                }}
              />
            </div>
            <input
              type="text"
              placeholder="Subject"
              disabled
              style={{
                padding: "0.875rem 1rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--border-radius)",
                backgroundColor: "var(--color-background)",
              }}
            />
            <textarea
              placeholder="Your message..."
              rows={5}
              disabled
              style={{
                padding: "0.875rem 1rem",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--border-radius)",
                backgroundColor: "var(--color-background)",
                resize: "vertical",
              }}
            />
            <button
              type="button"
              style={{
                padding: "1rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-text-inverse)",
                border: "none",
                borderRadius: "var(--border-radius)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {ctaText}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Split variant
  if (variant === "split") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--content-width)",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 600,
                marginBottom: "1rem",
                color: "var(--color-text-primary)",
              }}
            >
              {title}
            </h2>
            <p
              style={{
                color: "var(--color-text-secondary)",
                marginBottom: "2rem",
                lineHeight: 1.7,
              }}
            >
              {subtitle}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
                  Email
                </div>
                <div style={{ color: "var(--color-text-primary)" }}>{email}</div>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--color-surface)",
              padding: "2rem",
              borderRadius: "var(--border-radius)",
            }}
          >
            <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input
                type="text"
                placeholder="Your name"
                disabled
                style={{
                  padding: "0.875rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: "var(--color-background)",
                }}
              />
              <input
                type="email"
                placeholder="Your email"
                disabled
                style={{
                  padding: "0.875rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: "var(--color-background)",
                }}
              />
              <textarea
                placeholder="Message"
                rows={4}
                disabled
                style={{
                  padding: "0.875rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: "var(--color-background)",
                  resize: "vertical",
                }}
              />
              <button
                type="button"
                style={{
                  padding: "1rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-text-inverse)",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {ctaText}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // Default: Simple variant
  return (
    <section
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 600,
            marginBottom: "1rem",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "2rem",
          }}
        >
          {subtitle}
        </p>
        <a
          href={`mailto:${email}`}
          style={{
            display: "inline-block",
            padding: "1rem 2rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-inverse)",
            textDecoration: "none",
            borderRadius: "var(--border-radius)",
            fontWeight: 600,
          }}
        >
          {ctaText}
        </a>
        {email && (
          <p style={{ marginTop: "1rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            or email directly at{" "}
            <a href={`mailto:${email}`} style={{ color: "var(--color-accent)" }}>
              {email}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
