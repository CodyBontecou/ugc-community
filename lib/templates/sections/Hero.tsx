/**
 * Hero Section Component
 *
 * Variants:
 * - centered: Text centered, optional background media
 * - split-left: Image left, text right
 * - split-right: Text left, image right
 * - video-bg: Looping video background with overlay
 * - minimal: Just text, no media, maximum whitespace
 */

import type { SectionContent, Media } from "@/lib/db/schema";
import type { HeroVariant } from "../types";

export interface HeroProps {
  variant?: HeroVariant;
  content?: SectionContent;
  mediaMap?: Map<string, Media>;
}

export function Hero({ variant = "centered", content, mediaMap }: HeroProps) {
  const {
    headline,
    subheadline,
    backgroundMediaId,
    ctaText,
    ctaLink,
    showScrollIndicator,
  } = content ?? {};

  const backgroundMedia = backgroundMediaId
    ? mediaMap?.get(backgroundMediaId)
    : undefined;

  switch (variant) {
    case "minimal":
      return (
        <HeroMinimal
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          ctaLink={ctaLink}
          showScrollIndicator={showScrollIndicator}
        />
      );
    case "split-left":
      return (
        <HeroSplit
          side="left"
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          ctaLink={ctaLink}
          media={backgroundMedia}
          showScrollIndicator={showScrollIndicator}
        />
      );
    case "split-right":
      return (
        <HeroSplit
          side="right"
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          ctaLink={ctaLink}
          media={backgroundMedia}
          showScrollIndicator={showScrollIndicator}
        />
      );
    case "video-bg":
      return (
        <HeroVideo
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          ctaLink={ctaLink}
          media={backgroundMedia}
          showScrollIndicator={showScrollIndicator}
        />
      );
    case "centered":
    default:
      return (
        <HeroCentered
          headline={headline}
          subheadline={subheadline}
          ctaText={ctaText}
          ctaLink={ctaLink}
          media={backgroundMedia}
          showScrollIndicator={showScrollIndicator}
        />
      );
  }
}

// =====================================================
// Variant: Centered
// =====================================================

interface HeroCenteredProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  media?: Media;
  showScrollIndicator?: boolean;
}

function HeroCentered({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  media,
  showScrollIndicator,
}: HeroCenteredProps) {
  const hasMedia = !!media;
  const isVideo = media?.type === "video";

  return (
    <section
      className="hero hero--centered"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: hasMedia ? "transparent" : "var(--color-background)",
        color: hasMedia ? "var(--color-text-inverse)" : "var(--color-text-primary)",
        overflow: "hidden",
      }}
    >
      {/* Background Media */}
      {hasMedia && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
          }}
        >
          {isVideo ? (
            <video
              src={media.url}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <img
              src={media.url}
              alt={media.metadata?.alt ?? ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "var(--content-width)",
          padding: "2rem",
        }}
      >
        {headline && (
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              marginBottom: "1rem",
              lineHeight: 1.1,
            }}
          >
            {headline}
          </h1>
        )}
        {subheadline && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              opacity: 0.9,
              marginBottom: "2rem",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {subheadline}
          </p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: "var(--border-radius)",
              transition: "opacity 0.2s ease",
            }}
          >
            {ctaText}
          </a>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && <ScrollIndicator />}
    </section>
  );
}

// =====================================================
// Variant: Split
// =====================================================

interface HeroSplitProps {
  side: "left" | "right";
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  media?: Media;
  showScrollIndicator?: boolean;
}

function HeroSplit({
  side,
  headline,
  subheadline,
  ctaText,
  ctaLink,
  media,
  showScrollIndicator,
}: HeroSplitProps) {
  const isVideo = media?.type === "video";
  const imageOnLeft = side === "left";

  const textContent = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "3rem",
        backgroundColor: "var(--color-background)",
      }}
    >
      {headline && (
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
            fontWeight: 700,
            marginBottom: "1rem",
            lineHeight: 1.1,
            color: "var(--color-text-primary)",
          }}
        >
          {headline}
        </h1>
      )}
      {subheadline && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
            color: "var(--color-text-secondary)",
            marginBottom: "2rem",
            maxWidth: "500px",
          }}
        >
          {subheadline}
        </p>
      )}
      {ctaText && ctaLink && (
        <a
          href={ctaLink}
          style={{
            display: "inline-block",
            width: "fit-content",
            padding: "1rem 2rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-text-inverse)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            textDecoration: "none",
            borderRadius: "var(--border-radius)",
            transition: "opacity 0.2s ease",
          }}
        >
          {ctaText}
        </a>
      )}
    </div>
  );

  const mediaContent = (
    <div
      style={{
        flex: 1,
        minHeight: "400px",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {media ? (
        isVideo ? (
          <video
            src={media.url}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <img
            src={media.url}
            alt={media.metadata?.alt ?? ""}
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
  );

  return (
    <section
      className={`hero hero--split-${side}`}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .hero--split-left, .hero--split-right {
            flex-direction: column !important;
          }
        }
      `}</style>
      {imageOnLeft ? (
        <>
          {mediaContent}
          {textContent}
        </>
      ) : (
        <>
          {textContent}
          {mediaContent}
        </>
      )}

      {/* Scroll Indicator */}
      {showScrollIndicator && <ScrollIndicator />}
    </section>
  );
}

// =====================================================
// Variant: Video Background
// =====================================================

interface HeroVideoProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  media?: Media;
  showScrollIndicator?: boolean;
}

function HeroVideo({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  media,
  showScrollIndicator,
}: HeroVideoProps) {
  const isVideo = media?.type === "video";

  return (
    <section
      className="hero hero--video-bg"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: "var(--color-text-inverse)",
        overflow: "hidden",
      }}
    >
      {/* Video Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundColor: "#000",
        }}
      >
        {media && isVideo ? (
          <video
            src={media.url}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : media ? (
          <img
            src={media.url}
            alt={media.metadata?.alt ?? ""}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        {/* Dark Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "var(--content-width)",
          padding: "2rem",
        }}
      >
        {headline && (
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              marginBottom: "1rem",
              lineHeight: 1.05,
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {headline}
          </h1>
        )}
        {subheadline && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              opacity: 0.95,
              marginBottom: "2rem",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
              textShadow: "0 1px 10px rgba(0,0,0,0.3)",
            }}
          >
            {subheadline}
          </p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            style={{
              display: "inline-block",
              padding: "1rem 2.5rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-text-inverse)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "1.1rem",
              textDecoration: "none",
              borderRadius: "var(--border-radius)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              transition: "transform 0.2s ease",
            }}
          >
            {ctaText}
          </a>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && <ScrollIndicator light />}
    </section>
  );
}

// =====================================================
// Variant: Minimal
// =====================================================

interface HeroMinimalProps {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  showScrollIndicator?: boolean;
}

function HeroMinimal({
  headline,
  subheadline,
  ctaText,
  ctaLink,
  showScrollIndicator,
}: HeroMinimalProps) {
  return (
    <section
      className="hero hero--minimal"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: "var(--color-background)",
        color: "var(--color-text-primary)",
        padding: "4rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
        }}
      >
        {headline && (
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 300,
              marginBottom: "1.5rem",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </h1>
        )}
        {subheadline && (
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              color: "var(--color-text-secondary)",
              marginBottom: "3rem",
              maxWidth: "500px",
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            {subheadline}
          </p>
        )}
        {ctaText && ctaLink && (
          <a
            href={ctaLink}
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              backgroundColor: "transparent",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              textDecoration: "none",
              border: `1px solid var(--color-border)`,
              borderRadius: "var(--border-radius)",
              transition: "all 0.2s ease",
            }}
          >
            {ctaText}
          </a>
        )}
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && <ScrollIndicator />}
    </section>
  );
}

// =====================================================
// Scroll Indicator
// =====================================================

function ScrollIndicator({ light = false }: { light?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        opacity: light ? 0.8 : 0.5,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: light ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
        }}
      >
        Scroll
      </span>
      <div
        style={{
          width: "1px",
          height: "40px",
          backgroundColor: light
            ? "var(--color-text-inverse)"
            : "var(--color-text-secondary)",
        }}
      />
    </div>
  );
}

export default Hero;
