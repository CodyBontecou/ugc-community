"use client";

/**
 * Testimonials Section Preview Component
 */

import type { Media } from "@/lib/db/schema";

interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatarMediaId?: string;
}

export interface TestimonialsPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
  mediaMap?: Map<string, Media>;
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    quote: "Amazing work! The content exceeded our expectations and drove incredible engagement.",
    author: "Sarah Johnson",
    role: "Marketing Director",
    company: "Brand Co",
  },
  {
    quote: "Professional, creative, and delivered on time. Highly recommend!",
    author: "Mike Chen",
    role: "Founder",
    company: "Startup Inc",
  },
  {
    quote: "The best UGC creator we've worked with. Truly understands brand voice.",
    author: "Emily Davis",
    role: "Social Media Manager",
    company: "Agency X",
  },
];

export function TestimonialsPreview({ variant = "grid", content, mediaMap }: TestimonialsPreviewProps) {
  const title = (content?.title as string) || "What Clients Say";
  const testimonials = ((content?.testimonials as Testimonial[]) || DEFAULT_TESTIMONIALS).slice(0, 6);

  // Featured variant
  if (variant === "featured") {
    const featured = testimonials[0];
    const rest = testimonials.slice(1);

    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 600,
              marginBottom: "3rem",
              textAlign: "center",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>

          {/* Featured testimonial */}
          <div
            style={{
              backgroundColor: "var(--color-background)",
              padding: "3rem",
              borderRadius: "var(--border-radius)",
              boxShadow: "var(--shadow)",
              marginBottom: "2rem",
              textAlign: "center",
            }}
          >
            <blockquote
              style={{
                fontSize: "1.5rem",
                fontStyle: "italic",
                color: "var(--color-text-primary)",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              &ldquo;{featured.quote}&rdquo;
            </blockquote>
            <div>
              <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{featured.author}</div>
              {(featured.role || featured.company) && (
                <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                  {[featured.role, featured.company].filter(Boolean).join(" at ")}
                </div>
              )}
            </div>
          </div>

          {/* Rest */}
          {rest.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(rest.length, 2)}, 1fr)`, gap: "1.5rem" }}>
              {rest.map((t, i) => (
                <TestimonialCard key={i} testimonial={t} />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Carousel-style (showing one at a time - simplified for preview)
  if (variant === "carousel") {
    const featured = testimonials[0];

    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
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

          <blockquote
            style={{
              fontSize: "1.5rem",
              fontStyle: "italic",
              color: "var(--color-text-primary)",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            &ldquo;{featured.quote}&rdquo;
          </blockquote>
          <div>
            <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{featured.author}</div>
            {(featured.role || featured.company) && (
              <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                {[featured.role, featured.company].filter(Boolean).join(" at ")}
              </div>
            )}
          </div>

          {/* Navigation dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
            {testimonials.map((_, i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: i === 0 ? "var(--color-accent)" : "var(--color-border)",
                }}
              />
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
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 600,
            marginBottom: "3rem",
            textAlign: "center",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
          }}
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-background)",
        padding: "2rem",
        borderRadius: "var(--border-radius)",
        boxShadow: "var(--shadow)",
      }}
    >
      <blockquote
        style={{
          fontSize: "1rem",
          fontStyle: "italic",
          color: "var(--color-text-primary)",
          marginBottom: "1.5rem",
          lineHeight: 1.6,
        }}
      >
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            color: "var(--color-accent)",
          }}
        >
          {testimonial.author.charAt(0)}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{testimonial.author}</div>
          {(testimonial.role || testimonial.company) && (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              {[testimonial.role, testimonial.company].filter(Boolean).join(" at ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
