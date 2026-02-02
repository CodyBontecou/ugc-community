/**
 * Testimonials Section Component
 *
 * Variants:
 * - carousel: One at a time (static for now, can add JS later)
 * - grid: 2-3 column card grid
 * - featured: Single large quote
 * - marquee: Continuous horizontal display
 */

import type { SectionContent, Media } from "@/lib/db/schema";
import type { TestimonialsVariant } from "../types";

export interface TestimonialsProps {
  variant?: TestimonialsVariant;
  content?: SectionContent;
  mediaMap?: Map<string, Media>;
}

interface TestimonialItem {
  quote: string;
  name: string;
  company?: string;
  avatarMediaId?: string;
}

export function Testimonials({ variant = "grid", content, mediaMap }: TestimonialsProps) {
  const {
    title = "What Brands Say",
    testimonials = [],
  } = content ?? {};

  if (testimonials.length === 0) {
    return null;
  }

  // Resolve avatar URLs
  const testimonialsWithAvatars = testimonials.map((t) => ({
    ...t,
    avatarUrl: t.avatarMediaId ? mediaMap?.get(t.avatarMediaId)?.url : undefined,
  }));

  return (
    <section
      className="testimonials"
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
        {title && (
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 600,
              marginBottom: "3rem",
              textAlign: "center",
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h2>
        )}

        {/* Content */}
        {variant === "carousel" && <TestimonialsCarousel testimonials={testimonialsWithAvatars} />}
        {variant === "grid" && <TestimonialsGrid testimonials={testimonialsWithAvatars} />}
        {variant === "featured" && <TestimonialsFeatured testimonials={testimonialsWithAvatars} />}
        {variant === "marquee" && <TestimonialsMarquee testimonials={testimonialsWithAvatars} />}
      </div>
    </section>
  );
}

type TestimonialWithAvatar = TestimonialItem & { avatarUrl?: string };

// =====================================================
// Variant: Carousel (displays first item statically)
// =====================================================

function TestimonialsCarousel({ testimonials }: { testimonials: TestimonialWithAvatar[] }) {
  const [first] = testimonials;
  if (!first) return null;

  return (
    <div
      style={{
        maxWidth: "700px",
        marginLeft: "auto",
        marginRight: "auto",
        textAlign: "center",
      }}
    >
      <QuoteCard testimonial={first} large />

      {/* Dots indicator */}
      {testimonials.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "2rem",
          }}
        >
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
      )}
    </div>
  );
}

// =====================================================
// Variant: Grid
// =====================================================

function TestimonialsGrid({ testimonials }: { testimonials: TestimonialWithAvatar[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {testimonials.map((testimonial, i) => (
        <QuoteCard key={i} testimonial={testimonial} />
      ))}
    </div>
  );
}

// =====================================================
// Variant: Featured (single large quote)
// =====================================================

function TestimonialsFeatured({ testimonials }: { testimonials: TestimonialWithAvatar[] }) {
  const [first] = testimonials;
  if (!first) return null;

  return (
    <div
      style={{
        maxWidth: "800px",
        marginLeft: "auto",
        marginRight: "auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "4rem",
          color: "var(--color-accent)",
          opacity: 0.3,
          lineHeight: 1,
          marginBottom: "1rem",
        }}
      >
        "
      </div>
      <blockquote
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
          fontWeight: 400,
          lineHeight: 1.5,
          color: "var(--color-text-primary)",
          marginBottom: "2rem",
          fontStyle: "italic",
        }}
      >
        {first.quote}
      </blockquote>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        {first.avatarUrl && (
          <img
            src={first.avatarUrl}
            alt={first.name}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        )}
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {first.name}
          </div>
          {first.company && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {first.company}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Variant: Marquee
// =====================================================

function TestimonialsMarquee({ testimonials }: { testimonials: TestimonialWithAvatar[] }) {
  // Double the testimonials for seamless scroll
  const doubled = [...testimonials, ...testimonials];

  return (
    <div
      style={{
        overflow: "hidden",
        marginLeft: "-2rem",
        marginRight: "-2rem",
      }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 30s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div
        className="marquee-track"
        style={{
          display: "flex",
          gap: "1.5rem",
          width: "max-content",
        }}
      >
        {doubled.map((testimonial, i) => (
          <div
            key={i}
            style={{
              width: "350px",
              flexShrink: 0,
            }}
          >
            <QuoteCard testimonial={testimonial} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// Quote Card
// =====================================================

interface QuoteCardProps {
  testimonial: TestimonialWithAvatar;
  large?: boolean;
  compact?: boolean;
}

function QuoteCard({ testimonial, large, compact }: QuoteCardProps) {
  return (
    <div
      style={{
        padding: compact ? "1.5rem" : "2rem",
        backgroundColor: "var(--color-background)",
        borderRadius: "var(--border-radius)",
        boxShadow: "var(--shadow)",
      }}
    >
      <blockquote
        style={{
          fontFamily: "var(--font-body)",
          fontSize: large ? `calc(var(--font-size-base) * var(--font-scale))` : "var(--font-size-base)",
          lineHeight: 1.6,
          color: "var(--color-text-primary)",
          marginBottom: "1.5rem",
          fontStyle: "italic",
        }}
      >
        "{testimonial.quote}"
      </blockquote>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {testimonial.avatarUrl ? (
          <img
            src={testimonial.avatarUrl}
            alt={testimonial.name}
            style={{
              width: large ? "48px" : "40px",
              height: large ? "48px" : "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: large ? "48px" : "40px",
              height: large ? "48px" : "40px",
              borderRadius: "50%",
              backgroundColor: "var(--color-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
          >
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {testimonial.name}
          </div>
          {testimonial.company && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {testimonial.company}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Testimonials;
