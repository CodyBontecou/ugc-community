"use client";

/**
 * Stats Section Preview Component
 */

interface Stat {
  value: string;
  label: string;
}

export interface StatsPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
}

const DEFAULT_STATS: Stat[] = [
  { value: "50+", label: "Projects Completed" },
  { value: "100%", label: "Client Satisfaction" },
  { value: "3+", label: "Years Experience" },
  { value: "25+", label: "Happy Brands" },
];

export function StatsPreview({ variant = "inline", content }: StatsPreviewProps) {
  const stats = ((content?.stats as Stat[]) || DEFAULT_STATS).slice(0, 6);

  // Cards variant
  if (variant === "cards") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
              gap: "1.5rem",
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--color-background)",
                  padding: "2rem",
                  borderRadius: "var(--border-radius)",
                  boxShadow: "var(--shadow)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Large variant
  if (variant === "large") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-text-inverse)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
              gap: "3rem",
              textAlign: "center",
            }}
          >
            {stats.map((stat, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "4rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ opacity: 0.9, fontSize: "1rem" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Animated variant (simplified - actual animation would need more JS)
  if (variant === "animated") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-background)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            {stats.map((stat, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: "150px" }}>
                <div
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "3.5rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: Inline variant
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
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "2rem",
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: "0.25rem",
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
