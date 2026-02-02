/**
 * Contact Section Component
 *
 * Variants:
 * - simple: Email + social links only
 * - form: Contact form with submission
 * - split: Form on one side, info on other
 * - cta: Large CTA button + minimal info
 */

"use client";

import { useState } from "react";
import type { SectionContent, User } from "@/lib/db/schema";
import type { ContactVariant } from "../types";

export interface ContactProps {
  variant?: ContactVariant;
  content?: SectionContent;
  user?: User;
}

export function Contact({ variant = "simple", content, user }: ContactProps) {
  const {
    title = "Let's Work Together",
    subtitle,
    showForm = false,
    email: contentEmail,
    showSocials = true,
  } = content ?? {};

  // Use email from content, or fall back to user's email
  const displayEmail = contentEmail ?? user?.email ?? undefined;

  // Build social links from user profile
  const socialLinks = buildSocialLinks(user);

  switch (variant) {
    case "form":
      return (
        <ContactForm
          title={title}
          subtitle={subtitle}
          email={displayEmail}
          socialLinks={socialLinks}
          showSocials={showSocials}
          userSubdomain={user?.subdomain}
        />
      );
    case "split":
      return (
        <ContactSplit
          title={title}
          subtitle={subtitle}
          email={displayEmail}
          socialLinks={socialLinks}
          showSocials={showSocials}
          userSubdomain={user?.subdomain}
        />
      );
    case "cta":
      return (
        <ContactCTA
          title={title}
          subtitle={subtitle}
          email={displayEmail}
          socialLinks={socialLinks}
          showSocials={showSocials}
        />
      );
    case "simple":
    default:
      return (
        <ContactSimple
          title={title}
          subtitle={subtitle}
          email={displayEmail}
          socialLinks={socialLinks}
          showSocials={showSocials}
        />
      );
  }
}

// =====================================================
// Types
// =====================================================

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

interface ContactBaseProps {
  title?: string;
  subtitle?: string;
  email?: string;
  socialLinks: SocialLink[];
  showSocials?: boolean;
  userSubdomain?: string | null;
}

// =====================================================
// Build Social Links
// =====================================================

function buildSocialLinks(user?: User): SocialLink[] {
  const links: SocialLink[] = [];

  if (user?.instagramHandles?.length) {
    user.instagramHandles.forEach((handle) => {
      links.push({
        platform: "Instagram",
        url: `https://instagram.com/${handle.replace("@", "")}`,
        icon: "📸",
      });
    });
  }

  if (user?.tiktokHandles?.length) {
    user.tiktokHandles.forEach((handle) => {
      links.push({
        platform: "TikTok",
        url: `https://tiktok.com/@${handle.replace("@", "")}`,
        icon: "🎵",
      });
    });
  }

  if (user?.youtubeHandles?.length) {
    user.youtubeHandles.forEach((handle) => {
      links.push({
        platform: "YouTube",
        url: `https://youtube.com/@${handle.replace("@", "")}`,
        icon: "📺",
      });
    });
  }

  if (user?.twitterHandles?.length) {
    user.twitterHandles.forEach((handle) => {
      links.push({
        platform: "X (Twitter)",
        url: `https://x.com/${handle.replace("@", "")}`,
        icon: "🐦",
      });
    });
  }

  if (user?.websiteUrl) {
    links.push({
      platform: "Website",
      url: user.websiteUrl,
      icon: "🌐",
    });
  }

  return links;
}

// =====================================================
// Variant: Simple
// =====================================================

function ContactSimple({
  title,
  subtitle,
  email,
  socialLinks,
  showSocials,
}: ContactBaseProps) {
  return (
    <section
      className="contact contact--simple"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-background)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {title && (
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 600,
              marginBottom: subtitle ? "0.75rem" : "2rem",
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
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Email */}
        {email && (
          <a
            href={`mailto:${email}`}
            style={{
              display: "inline-block",
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              color: "var(--color-accent)",
              textDecoration: "none",
              marginBottom: "2rem",
            }}
          >
            {email}
          </a>
        )}

        {/* Social Links */}
        {showSocials && socialLinks.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: email ? "0" : "1rem",
            }}
          >
            {socialLinks.map((link, i) => (
              <SocialButton key={i} link={link} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Variant: Form
// =====================================================

function ContactForm({
  title,
  subtitle,
  email,
  socialLinks,
  showSocials,
  userSubdomain,
}: ContactBaseProps) {
  return (
    <section
      className="contact contact--form"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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

        {/* Form */}
        <ContactFormFields subdomain={userSubdomain} />

        {/* Social Links */}
        {showSocials && socialLinks.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "2rem",
              paddingTop: "2rem",
              borderTop: `1px solid var(--color-border)`,
            }}
          >
            {socialLinks.map((link, i) => (
              <SocialButton key={i} link={link} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Variant: Split
// =====================================================

function ContactSplit({
  title,
  subtitle,
  email,
  socialLinks,
  showSocials,
  userSubdomain,
}: ContactBaseProps) {
  return (
    <section
      className="contact contact--split"
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
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        <style>{`
          @media (max-width: 768px) {
            .contact--split > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Info Side */}
        <div>
          {title && (
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
                fontWeight: 600,
                marginBottom: "1rem",
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
                marginBottom: "2rem",
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}

          {/* Contact Info */}
          {email && (
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.5rem",
                }}
              >
                Email
              </div>
              <a
                href={`mailto:${email}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--font-size-base)",
                  color: "var(--color-text-primary)",
                  textDecoration: "none",
                }}
              >
                {email}
              </a>
            </div>
          )}

          {/* Social Links */}
          {showSocials && socialLinks.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                Social
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {socialLinks.map((link, i) => (
                  <SocialButton key={i} link={link} compact />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Side */}
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            padding: "2rem",
            borderRadius: "var(--border-radius)",
          }}
        >
          <ContactFormFields subdomain={userSubdomain} />
        </div>
      </div>
    </section>
  );
}

// =====================================================
// Variant: CTA
// =====================================================

function ContactCTA({
  title,
  subtitle,
  email,
  socialLinks,
  showSocials,
}: ContactBaseProps) {
  return (
    <section
      className="contact contact--cta"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: "var(--color-accent)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {title && (
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              marginBottom: subtitle ? "1rem" : "2rem",
              color: "var(--color-text-inverse)",
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              color: "var(--color-text-inverse)",
              opacity: 0.9,
              marginBottom: "2.5rem",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}

        {/* CTA Button */}
        {email && (
          <a
            href={`mailto:${email}`}
            style={{
              display: "inline-block",
              padding: "1rem 3rem",
              backgroundColor: "var(--color-background)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              textDecoration: "none",
              borderRadius: "var(--border-radius)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
            }}
          >
            Get In Touch
          </a>
        )}

        {/* Social Links */}
        {showSocials && socialLinks.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "2.5rem",
            }}
          >
            {socialLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--color-text-inverse)",
                  opacity: 0.8,
                  textDecoration: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.875rem",
                }}
              >
                {link.icon} {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// =====================================================
// Contact Form Fields
// =====================================================

function ContactFormFields({ subdomain }: { subdomain?: string | null }) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/portfolio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          creatorSubdomain: subdomain,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormState({ name: "", email: "", company: "", message: "" });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (status === "success") {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
        <h3
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--color-text-primary)",
          }}
        >
          Message Sent!
        </h3>
        <p
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--color-text-secondary)",
          }}
        >
          Thanks for reaching out. I&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.875rem 1rem",
    fontFamily: "var(--font-body)",
    fontSize: "var(--font-size-base)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-text-primary)",
    border: `1px solid var(--color-border)`,
    borderRadius: "var(--border-radius)",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.5rem",
    color: "var(--color-text-primary)",
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={formState.name}
          onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={formState.email}
          onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Company</label>
        <input
          type="text"
          value={formState.company}
          onChange={(e) => setFormState((s) => ({ ...s, company: e.target.value }))}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>Project Details</label>
        <textarea
          value={formState.message}
          onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
          required
          rows={4}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: "100px",
          }}
        />
      </div>

      {status === "error" && (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "var(--border-radius)",
            color: "#DC2626",
            fontFamily: "var(--font-body)",
            fontSize: "0.875rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: "var(--color-accent)",
          color: "var(--color-text-inverse)",
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: "var(--font-size-base)",
          border: "none",
          borderRadius: "var(--border-radius)",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
          transition: "opacity 0.2s ease",
        }}
      >
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

// =====================================================
// Social Button
// =====================================================

function SocialButton({ link, compact }: { link: SocialLink; compact?: boolean }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: compact ? "0.5rem 0.75rem" : "0.5rem 1rem",
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text-primary)",
        textDecoration: "none",
        fontFamily: "var(--font-body)",
        fontSize: compact ? "0.75rem" : "0.875rem",
        borderRadius: "var(--border-radius)",
        border: `1px solid var(--color-border)`,
        transition: "all 0.2s ease",
      }}
    >
      <span>{link.icon}</span>
      {!compact && <span>{link.platform}</span>}
    </a>
  );
}

export default Contact;
