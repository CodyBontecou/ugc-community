"use client";

/**
 * Services Section Preview Component
 */

interface Service {
  title: string;
  description: string;
  price?: string;
}

export interface ServicesPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
}

const DEFAULT_SERVICES: Service[] = [
  { title: "UGC Videos", description: "High-quality user-generated content for your brand", price: "$500+" },
  { title: "Product Reviews", description: "Authentic product reviews and testimonials", price: "$300+" },
  { title: "Social Content", description: "Engaging content for social media platforms", price: "$200+" },
];

export function ServicesPreview({ variant = "cards", content }: ServicesPreviewProps) {
  const title = (content?.title as string) || "Services";
  const subtitle = (content?.subtitle as string) || "What I can do for you";
  const services = ((content?.services as Service[]) || DEFAULT_SERVICES).slice(0, 6);

  // Pricing variant
  if (variant === "pricing") {
    return (
      <section
        style={{
          padding: "var(--section-gap) 2rem",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <div style={{ maxWidth: "var(--content-width)", margin: "0 auto", textAlign: "center" }}>
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
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem" }}>{subtitle}</p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(services.length, 3)}, 1fr)`,
              gap: "2rem",
            }}
          >
            {services.map((service, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--color-background)",
                  padding: "2rem",
                  borderRadius: "var(--border-radius)",
                  boxShadow: "var(--shadow)",
                  textAlign: "center",
                  border: i === 1 ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-heading)",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {service.title}
                </h3>
                {service.price && (
                  <div
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      marginBottom: "1rem",
                    }}
                  >
                    {service.price}
                  </div>
                )}
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                  {service.description}
                </p>
              </div>
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
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
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

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {services.map((service, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: "1.5rem",
                  borderBottom: i < services.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {service.title}
                  </h3>
                  <p style={{ color: "var(--color-text-secondary)" }}>{service.description}</p>
                </div>
                {service.price && (
                  <span
                    style={{
                      fontWeight: 600,
                      color: "var(--color-accent)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {service.price}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: Cards variant
  return (
    <section
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div style={{ maxWidth: "var(--content-width)", margin: "0 auto", textAlign: "center" }}>
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
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "3rem" }}>{subtitle}</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}
        >
          {services.map((service, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "2rem",
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--shadow)",
                textAlign: "left",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  marginBottom: "0.75rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {service.title}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                {service.description}
              </p>
              {service.price && (
                <span style={{ fontWeight: 600, color: "var(--color-accent)" }}>{service.price}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
