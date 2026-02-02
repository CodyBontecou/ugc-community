"use client";

/**
 * Hero Section Preview Component
 */

import type { Media } from "@/lib/db/schema";

export interface HeroPreviewProps {
  variant?: string;
  content?: Record<string, unknown>;
  mediaMap?: Map<string, Media>;
}

export function HeroPreview({ variant = "centered", content, mediaMap }: HeroPreviewProps) {
  const headline = content?.headline as string | undefined;
  const subheadline = content?.subheadline as string | undefined;
  const ctaText = content?.ctaText as string | undefined;
  const ctaLink = content?.ctaLink as string | undefined;
  const backgroundMediaId = content?.backgroundMediaId as string | undefined;
  const showScrollIndicator = content?.showScrollIndicator as boolean | undefined;

  const backgroundMedia = backgroundMediaId ? mediaMap?.get(backgroundMediaId) : undefined;

  // Default content for preview
  const displayHeadline = headline || "Your Headline Here";
  const displaySubheadline = subheadline || "Your subheadline or tagline goes here";

  const hasMedia = !!backgroundMedia;
  const isVideo = backgroundMedia?.type === "video";

  // Minimal variant
  if (variant === "minimal") {
    return (
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          backgroundColor: "var(--color-background)",
          padding: "4rem 2rem",
        }}
      >
        <div style={{ maxWidth: "800px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 300,
              marginBottom: "1.5rem",
              lineHeight: 1.1,
              color: "var(--color-text-primary)",
            }}
          >
            {displayHeadline}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.25rem",
              color: "var(--color-text-secondary)",
              marginBottom: "3rem",
              maxWidth: "500px",
              margin: "0 auto 3rem",
            }}
          >
            {displaySubheadline}
          </p>
          {ctaText && (
            <button
              style={{
                padding: "0.875rem 2rem",
                backgroundColor: "transparent",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
              }}
            >
              {ctaText}
            </button>
          )}
        </div>
      </section>
    );
  }

  // Split variants
  if (variant === "split-left" || variant === "split-right") {
    const imageOnLeft = variant === "split-left";

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
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 4vw, 3.5rem)",
            fontWeight: 700,
            marginBottom: "1rem",
            lineHeight: 1.1,
            color: "var(--color-text-primary)",
          }}
        >
          {displayHeadline}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.125rem",
            color: "var(--color-text-secondary)",
            marginBottom: "2rem",
            maxWidth: "500px",
          }}
        >
          {displaySubheadline}
        </p>
        {ctaText && (
          <button
            style={{
              width: "fit-content",
              padding: "1rem 2rem",
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
        )}
      </div>
    );

    const mediaContent = (
      <div
        style={{
          flex: 1,
          minHeight: "400px",
          backgroundColor: "var(--color-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {backgroundMedia ? (
          isVideo ? (
            <video
              src={backgroundMedia.url}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={backgroundMedia.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        ) : (
          <span style={{ color: "var(--color-text-secondary)" }}>Add media</span>
        )}
      </div>
    );

    return (
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "row",
        }}
      >
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
      </section>
    );
  }

  // Video background variant
  if (variant === "video-bg") {
    return (
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#000",
          }}
        >
          {backgroundMedia && isVideo ? (
            <video
              src={backgroundMedia.url}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : backgroundMedia ? (
            <img
              src={backgroundMedia.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1, padding: "2rem", maxWidth: "900px" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
              textShadow: "0 2px 20px rgba(0,0,0,0.3)",
            }}
          >
            {displayHeadline}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1.25rem",
              opacity: 0.95,
              marginBottom: "2rem",
              textShadow: "0 1px 10px rgba(0,0,0,0.3)",
            }}
          >
            {displaySubheadline}
          </p>
          {ctaText && (
            <button
              style={{
                padding: "1rem 2.5rem",
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--border-radius)",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {ctaText}
            </button>
          )}
        </div>
      </section>
    );
  }

  // Default: Centered variant
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        backgroundColor: hasMedia ? "transparent" : "var(--color-background)",
        color: hasMedia ? "#fff" : "var(--color-text-primary)",
        overflow: "hidden",
      }}
    >
      {hasMedia && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {isVideo ? (
            <video
              src={backgroundMedia!.url}
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={backgroundMedia!.url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, padding: "2rem", maxWidth: "900px" }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 700,
            marginBottom: "1rem",
            lineHeight: 1.1,
          }}
        >
          {displayHeadline}
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.25rem",
            opacity: 0.9,
            marginBottom: "2rem",
            maxWidth: "600px",
            margin: "0 auto 2rem",
          }}
        >
          {displaySubheadline}
        </p>
        {ctaText && (
          <button
            style={{
              padding: "1rem 2rem",
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
        )}
      </div>

      {showScrollIndicator && (
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: 0.5,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Scroll
          </span>
          <div style={{ width: "1px", height: "40px", backgroundColor: "currentColor", margin: "0.5rem auto 0" }} />
        </div>
      )}
    </section>
  );
}
