/**
 * Services Section Component
 *
 * Variants:
 * - cards: Card grid with icons
 * - list: Simple list with descriptions
 * - pricing: Cards with price points
 * - icons: Icon-focused minimal list
 */

import type { SectionContent } from "@/lib/db/schema";
import type { ServicesVariant } from "../types";

export interface ServicesProps {
  variant?: ServicesVariant;
  content?: SectionContent;
}

interface ServiceItem {
  title: string;
  description?: string;
  icon?: string;
  price?: string;
}

export function Services({ variant = "cards", content }: ServicesProps) {
  const {
    title = "Services",
    subtitle,
    services = [],
  } = content ?? {};

  if (services.length === 0) {
    return null;
  }

  return (
    <section
      className="services"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
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
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
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
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {variant === "cards" && <ServicesCards services={services} />}
        {variant === "list" && <ServicesList services={services} />}
        {variant === "pricing" && <ServicesPricing services={services} />}
        {variant === "icons" && <ServicesIcons services={services} />}
      </div>
    </section>
  );
}

// =====================================================
// Variant: Cards
// =====================================================

function ServicesCards({ services }: { services: ServiceItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {services.map((service, i) => (
        <div
          key={i}
          style={{
            padding: "2rem",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow)",
          }}
        >
          {service.icon && (
            <div
              style={{
                fontSize: "2rem",
                marginBottom: "1rem",
              }}
            >
              {service.icon}
            </div>
          )}
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              fontWeight: 600,
              marginBottom: "0.75rem",
              color: "var(--color-text-primary)",
            }}
          >
            {service.title}
          </h3>
          {service.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {service.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: List
// =====================================================

function ServicesList({ services }: { services: ServiceItem[] }) {
  return (
    <div
      style={{
        maxWidth: "700px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {services.map((service, i) => (
        <div
          key={i}
          style={{
            padding: "1.5rem 0",
            borderBottom: i < services.length - 1 ? `1px solid var(--color-border)` : "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
                  fontWeight: 600,
                  marginBottom: service.description ? "0.5rem" : 0,
                  color: "var(--color-text-primary)",
                }}
              >
                {service.icon && <span style={{ marginRight: "0.5rem" }}>{service.icon}</span>}
                {service.title}
              </h3>
              {service.description && (
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {service.description}
                </p>
              )}
            </div>
            {service.price && (
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  color: "var(--color-accent)",
                  whiteSpace: "nowrap",
                }}
              >
                {service.price}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Pricing
// =====================================================

function ServicesPricing({ services }: { services: ServiceItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
      }}
    >
      {services.map((service, i) => (
        <div
          key={i}
          style={{
            padding: "2.5rem 2rem",
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--border-radius)",
            boxShadow: "var(--shadow)",
            textAlign: "center",
            border: `1px solid var(--color-border)`,
          }}
        >
          {service.icon && (
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
              }}
            >
              {service.icon}
            </div>
          )}
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
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
                fontFamily: "var(--font-heading)",
                fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: "1rem",
              }}
            >
              {service.price}
            </div>
          )}
          {service.description && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {service.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Icons
// =====================================================

function ServicesIcons({ services }: { services: ServiceItem[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "3rem",
      }}
    >
      {services.map((service, i) => (
        <div
          key={i}
          style={{
            textAlign: "center",
            maxWidth: "200px",
          }}
        >
          {service.icon && (
            <div
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "var(--color-surface)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                marginLeft: "auto",
                marginRight: "auto",
                marginBottom: "1rem",
              }}
            >
              {service.icon}
            </div>
          )}
          <h3
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-base)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {service.title}
          </h3>
        </div>
      ))}
    </div>
  );
}

export default Services;
