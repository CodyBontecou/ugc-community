/**
 * Stats Section Component
 *
 * Variants:
 * - inline: Horizontal row of numbers
 * - cards: Individual stat cards
 * - large: Big numbers, minimal labels
 * - animated: Count-up animation on scroll (requires client JS)
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { SectionContent } from "@/lib/db/schema";
import type { StatsVariant } from "../types";

export interface StatsProps {
  variant?: StatsVariant;
  content?: SectionContent;
}

interface StatItem {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export function Stats({ variant = "inline", content }: StatsProps) {
  const {
    stats = [],
    showBackground = true,
  } = content ?? {};

  if (stats.length === 0) {
    return null;
  }

  return (
    <section
      className="stats"
      style={{
        padding: "var(--section-gap) 2rem",
        backgroundColor: showBackground ? "var(--color-accent)" : "var(--color-background)",
        color: showBackground ? "var(--color-text-inverse)" : "var(--color-text-primary)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-width)",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {variant === "inline" && <StatsInline stats={stats} onAccent={showBackground} />}
        {variant === "cards" && <StatsCards stats={stats} onAccent={showBackground} />}
        {variant === "large" && <StatsLarge stats={stats} onAccent={showBackground} />}
        {variant === "animated" && <StatsAnimated stats={stats} onAccent={showBackground} />}
      </div>
    </section>
  );
}

// =====================================================
// Variant: Inline
// =====================================================

function StatsInline({ stats, onAccent }: { stats: StatItem[]; onAccent: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "4rem",
        flexWrap: "wrap",
      }}
    >
      {stats.map((stat, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}
          >
            {stat.prefix}
            {stat.value}
            {stat.suffix}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--font-size-base)",
              opacity: onAccent ? 0.9 : 0.7,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Cards
// =====================================================

function StatsCards({ stats, onAccent }: { stats: StatItem[]; onAccent: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
        gap: "1.5rem",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .stats-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      {stats.map((stat, i) => (
        <div
          key={i}
          className="stats-cards-grid"
          style={{
            padding: "2rem",
            backgroundColor: onAccent
              ? "rgba(255,255,255,0.1)"
              : "var(--color-surface)",
            borderRadius: "var(--border-radius)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: "0.75rem",
            }}
          >
            {stat.prefix}
            {stat.value}
            {stat.suffix}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.875rem",
              opacity: onAccent ? 0.9 : 0.7,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Large
// =====================================================

function StatsLarge({ stats, onAccent }: { stats: StatItem[]; onAccent: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "6rem",
        flexWrap: "wrap",
      }}
    >
      {stats.map((stat, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: "0.75rem",
            }}
          >
            {stat.prefix}
            {stat.value}
            {stat.suffix}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: `calc(var(--font-size-base) * var(--font-scale))`,
              opacity: onAccent ? 0.9 : 0.7,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// Variant: Animated (count-up on scroll)
// =====================================================

function StatsAnimated({ stats, onAccent }: { stats: StatItem[]; onAccent: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "4rem",
        flexWrap: "wrap",
      }}
    >
      {stats.map((stat, i) => (
        <AnimatedStat
          key={i}
          stat={stat}
          animate={isVisible}
          onAccent={onAccent}
        />
      ))}
    </div>
  );
}

function AnimatedStat({
  stat,
  animate,
  onAccent,
}: {
  stat: StatItem;
  animate: boolean;
  onAccent: boolean;
}) {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!animate) return;

    // Extract numeric value
    const numericValue = parseFloat(stat.value.replace(/[^0-9.]/g, ""));
    if (isNaN(numericValue)) {
      setDisplayValue(stat.value);
      return;
    }

    // Animate count-up
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(numericValue * eased);

      // Preserve original format (e.g., "10M" vs "10")
      const hasLetterSuffix = /[A-Za-z]+$/.test(stat.value);
      if (hasLetterSuffix) {
        const suffix = stat.value.match(/[A-Za-z]+$/)?.[0] ?? "";
        setDisplayValue(`${value}${suffix}`);
      } else if (stat.value.includes(".")) {
        setDisplayValue(value.toFixed(1));
      } else {
        setDisplayValue(value.toString());
      }

      if (current >= steps) {
        setDisplayValue(stat.value);
        clearInterval(interval);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [animate, stat.value]);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: `calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale))`,
          fontWeight: 700,
          lineHeight: 1,
          marginBottom: "0.5rem",
        }}
      >
        {stat.prefix}
        {displayValue}
        {stat.suffix}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--font-size-base)",
          opacity: onAccent ? 0.9 : 0.7,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

export default Stats;
