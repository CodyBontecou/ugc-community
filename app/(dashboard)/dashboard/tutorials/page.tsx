import Link from "next/link";
import {
  BookOpen,
  Clock,
  Rocket,
  Palette,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getAllTutorials, type TutorialMeta } from "@/lib/tutorials";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tutorials - ugc.community",
  description:
    "Learn everything about UGC creation — from setting up your profile to going viral.",
};

const categoryMeta: Record<
  string,
  { icon: typeof Rocket; color: string; gradient: string }
> = {
  "Getting Started": {
    icon: Rocket,
    color: "text-coral",
    gradient: "from-coral/10 to-rose/10",
  },
  "Content Creation": {
    icon: Palette,
    color: "text-purple-dark",
    gradient: "from-lavender/10 to-purple-dark/10",
  },
  "Growth & Strategy": {
    icon: TrendingUp,
    color: "text-emerald-600",
    gradient: "from-emerald-100/60 to-mint/20",
  },
};

const iconMap: Record<string, string> = {
  rocket: "🚀",
  monitor: "📱",
  camera: "🎬",
  zap: "⚡",
  hook: "🪝",
  users: "👥",
  search: "🔍",
  "dollar-sign": "💰",
};

function TutorialCard({ tutorial }: { tutorial: TutorialMeta }) {
  const emoji = iconMap[tutorial.icon] || "📖";

  return (
    <Link
      href={`/dashboard/tutorials/${tutorial.slug}`}
      className="group relative bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 transition-all hover:shadow-md hover:border-warm-gray-300 hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-[--radius-md] bg-warm-gray-50 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-warm-gray-900 group-hover:text-coral transition-colors mb-1">
            {tutorial.title}
          </h3>
          <p className="text-sm text-warm-gray-500 line-clamp-2 mb-3">
            {tutorial.description}
          </p>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs text-warm-gray-400">
              <Clock size={12} />
              {tutorial.estimatedReadTime}
            </span>
            <span className="text-xs text-warm-gray-300">·</span>
            <span className="text-xs text-warm-gray-400">
              {tutorial.category}
            </span>
          </div>
        </div>
        <ArrowRight
          size={18}
          className="text-warm-gray-300 group-hover:text-coral group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
        />
      </div>
    </Link>
  );
}

export default function TutorialsPage() {
  const tutorials = getAllTutorials();

  // Group by category preserving order
  const categories = [
    "Getting Started",
    "Content Creation",
    "Growth & Strategy",
  ];
  const grouped = categories
    .map((cat) => ({
      name: cat,
      tutorials: tutorials.filter((t) => t.category === cat),
    }))
    .filter((g) => g.tutorials.length > 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-[--radius-md] bg-gradient-to-br from-coral/10 to-rose/10 flex items-center justify-center">
            <BookOpen size={20} className="text-coral" />
          </div>
          <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Creator Tutorials
          </h1>
        </div>
        <p className="text-warm-gray-500 max-w-2xl">
          Everything you need to build a successful UGC career — from your first
          video to viral content strategies. Learn at your own pace.
        </p>
      </div>

      {/* Quick start banner */}
      {tutorials.length > 0 && (
        <Link
          href={`/dashboard/tutorials/${tutorials[0].slug}`}
          className="group flex items-center gap-4 bg-gradient-to-r from-coral/5 to-rose/5 rounded-[--radius-xl] border border-coral/20 p-5 mb-10 hover:border-coral/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-coral/10 flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-coral" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-warm-gray-900 mb-0.5">
              New to UGC?
            </h2>
            <p className="text-sm text-warm-gray-500">
              Start with our getting started guide — we&apos;ll walk you through
              everything step by step.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="text-coral/50 group-hover:text-coral group-hover:translate-x-1 transition-all flex-shrink-0"
          />
        </Link>
      )}

      {/* Tutorial categories */}
      {grouped.map((group) => {
        const meta = categoryMeta[group.name];
        const Icon = meta?.icon || BookOpen;

        return (
          <section key={group.name} className="mb-10 last:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <Icon
                size={16}
                className={meta?.color || "text-warm-gray-400"}
              />
              <h2 className="text-lg font-semibold text-warm-gray-900 font-[family-name:var(--font-body)]">
                {group.name}
              </h2>
              <span className="text-xs text-warm-gray-400 bg-warm-gray-100 px-2 py-0.5 rounded-full">
                {group.tutorials.length}{" "}
                {group.tutorials.length === 1 ? "guide" : "guides"}
              </span>
            </div>
            <div className="grid gap-3">
              {group.tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.slug} tutorial={tutorial} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {tutorials.length === 0 && (
        <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-warm-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-warm-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-warm-gray-900 mb-2">
            Tutorials coming soon
          </h2>
          <p className="text-warm-gray-500">
            We&apos;re working on guides to help you level up your UGC game.
            Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
