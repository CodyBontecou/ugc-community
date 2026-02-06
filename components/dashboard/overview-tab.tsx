"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  Mail,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Globe,
  Sparkles,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trophy,
  Star,
} from "lucide-react";
import type { Stats, PortfolioStatus } from "@/lib/types/analytics";
import type { TabId } from "./dashboard-shell";
import { ContentPostsTable } from "./content-posts-table";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type MilestoneWithEarned = {
  id: string;
  threshold: number;
  name: string;
  earned: boolean;
};

type MilestoneProgressData = {
  monthly: {
    postCount: number;
    daysRemaining: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: { threshold: number; postsNeeded: number } | null;
  };
  lifetime: {
    postCount: number;
    milestones: MilestoneWithEarned[];
    nextMilestone: { threshold: number; postsNeeded: number } | null;
  };
};

interface OverviewTabProps {
  onNavigate: (tab: TabId) => void;
}

/* ──────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────── */

export function OverviewTab({ onNavigate }: OverviewTabProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioStatus | null>(null);
  const [milestones, setMilestones] = useState<MilestoneProgressData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, portfolioRes, milestoneRes] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/user/portfolio-status"),
          fetch("/api/user/milestones"),
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (portfolioRes.ok) setPortfolio(await portfolioRes.json());
        if (milestoneRes.ok) setMilestones(await milestoneRes.json());
      } catch {
        // Silently fail — individual sections just won't appear
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[104px] bg-warm-gray-100 rounded-[--radius-lg]"
            />
          ))}
        </div>
        <div className="h-[100px] bg-warm-gray-100 rounded-[--radius-xl]" />
        <div className="h-[140px] bg-warm-gray-100 rounded-[--radius-xl]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-[88px] bg-warm-gray-100 rounded-[--radius-lg]" />
          <div className="h-[88px] bg-warm-gray-100 rounded-[--radius-lg]" />
        </div>
      </div>
    );
  }

  /* ── Decide the "next step" ── */
  const nextAction = getNextAction(portfolio, milestones, onNavigate);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="space-y-5"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* ─── Quick Stats Grid ─── */}
      {stats?.hasSubdomain && (
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <StatTile
            label="Profile Views"
            value={stats.profileViewCount}
            icon={Eye}
            color="coral"
          />
          <StatTile
            label="Portfolio Views"
            value={stats.portfolioViewCount || 0}
            icon={Globe}
            color="warm"
          />
          <StatTile
            label="Inquiries"
            value={stats.contactSubmissions.total}
            icon={Mail}
            color="rose"
            subtitle={
              stats.contactSubmissions.last7Days > 0
                ? `+${stats.contactSubmissions.last7Days} this week`
                : undefined
            }
          />
          <StatTile
            label="Monthly Posts"
            value={portfolio?.monthlyPostCount ?? 0}
            icon={TrendingUp}
            color="coral-dark"
            subtitle={
              portfolio
                ? `of ${portfolio.requiredPostCount} needed`
                : undefined
            }
          />
        </motion.div>
      )}

      {/* ─── Next Action Card ─── */}
      <motion.div variants={fadeUp}>
        <NextActionCard {...nextAction} />
      </motion.div>

      {/* ─── Recent Recognized Posts ─── */}
      <motion.div variants={fadeUp}>
        <ContentPostsTable
          limit={3}
          compact
          onViewAll={() => onNavigate("analytics")}
        />
      </motion.div>

      {/* ─── Compact Milestones ─── */}
      {milestones &&
        (milestones.monthly?.milestones?.length > 0 ||
          milestones.lifetime?.milestones?.length > 0) && (
          <motion.div variants={fadeUp}>
            <CompactMilestones
              data={milestones}
              onViewAll={() => onNavigate("portfolio")}
            />
          </motion.div>
        )}

      {/* ─── Compact Portfolio Status ─── */}
      {portfolio && (
        <motion.div variants={fadeUp}>
          <CompactPortfolioStatus
            status={portfolio}
            onManage={() => onNavigate("portfolio")}
          />
        </motion.div>
      )}


    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Helper: determine contextual next action
   ────────────────────────────────────────────── */

function getNextAction(
  portfolio: PortfolioStatus | null,
  milestones: MilestoneProgressData | null,
  onNavigate: (tab: TabId) => void
) {
  // 1) No portfolio yet → set up
  if (!portfolio) {
    return {
      title: "Set up your portfolio",
      description:
        "Complete the questionnaire so we can generate your creator portfolio.",
      cta: "Get Started",
      action: () => onNavigate("portfolio"),
      icon: Sparkles,
      accent: "coral" as const,
    };
  }

  // 2) Portfolio inactive → post more
  if (!portfolio.isActive && !portfolio.hasHostingReward) {
    const postsNeeded = Math.max(
      0,
      portfolio.requiredPostCount - portfolio.monthlyPostCount
    );
    return {
      title: `Post ${postsNeeded} more time${postsNeeded !== 1 ? "s" : ""} this month`,
      description:
        "Keep your portfolio live by tagging @ugc.community in your TikTok content.",
      cta: "View Status",
      action: () => onNavigate("portfolio"),
      icon: Target,
      accent: "amber" as const,
    };
  }

  // 3) Close to next milestone
  if (milestones?.lifetime?.nextMilestone) {
    const next = milestones.lifetime.nextMilestone;
    return {
      title: `${next.postsNeeded} post${next.postsNeeded !== 1 ? "s" : ""} to next milestone`,
      description: `Reach ${next.threshold} lifetime posts to unlock new rewards.`,
      cta: "View Milestones",
      action: () => onNavigate("portfolio"),
      icon: Trophy,
      accent: "rose" as const,
    };
  }

  // 4) Default → browse jobs
  return {
    title: "Browse content jobs",
    description:
      "Find new opportunities and keep growing your creator career.",
    cta: "View Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    accent: "coral" as const,
  };
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

/* ── Stat Tile ── */

const STAT_COLORS: Record<string, { bg: string; text: string }> = {
  coral: { bg: "bg-coral/10", text: "text-coral" },
  rose: { bg: "bg-rose/10", text: "text-rose" },
  "coral-dark": { bg: "bg-coral-dark/10", text: "text-coral-dark" },
  warm: { bg: "bg-warm-gray-100", text: "text-warm-gray-600" },
};

function StatTile({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
  color: string;
  subtitle?: string;
}) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.coral;

  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center`}
        >
          <Icon size={16} className={c.text} />
        </div>
      </div>
      <p className="text-2xl font-bold text-warm-gray-900 tabular-nums leading-none">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-warm-gray-500 mt-1.5">{label}</p>
      {subtitle && (
        <p className="text-[11px] text-warm-gray-400 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

/* ── Next Action Card ── */

const ACCENT_STYLES: Record<
  string,
  { card: string; btn: string; iconClass: string }
> = {
  coral: {
    card: "from-coral/[0.08] to-rose/[0.04] border-coral/20",
    btn: "bg-gradient-to-r from-coral to-rose text-white",
    iconClass: "text-coral",
  },
  amber: {
    card: "from-amber-50 to-amber-50/40 border-amber-200/60",
    btn: "bg-amber-500 text-white",
    iconClass: "text-amber-500",
  },
  rose: {
    card: "from-rose/[0.08] to-coral/[0.04] border-rose/20",
    btn: "bg-gradient-to-r from-coral to-rose text-white",
    iconClass: "text-rose",
  },
};

function NextActionCard({
  title,
  description,
  cta,
  action,
  href,
  icon: Icon,
  accent,
}: {
  title: string;
  description: string;
  cta: string;
  action?: () => void;
  href?: string;
  icon: typeof Sparkles;
  accent: string;
}) {
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.coral;

  const inner = (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[--radius-xl] bg-gradient-to-br ${style.card} border`}
    >
      <div className="w-11 h-11 rounded-full bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
        <Icon size={22} className={style.iconClass} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-warm-gray-400 mb-0.5">
          Next Step
        </p>
        <h3 className="font-semibold text-warm-gray-900 leading-snug">
          {title}
        </h3>
        <p className="text-sm text-warm-gray-600 mt-0.5">{description}</p>
      </div>

      <span
        className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-full ${style.btn} shadow-sm hover:opacity-90 transition-opacity flex-shrink-0`}
      >
        {cta}
        <ArrowRight size={14} />
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return (
    <button onClick={action} className="w-full text-left">
      {inner}
    </button>
  );
}

/* ── Compact Milestones ── */

function CompactMilestones({
  data,
  onViewAll,
}: {
  data: MilestoneProgressData;
  onViewAll: () => void;
}) {
  const tracks: {
    label: string;
    postCount: number;
    earned: number;
    total: number;
    nextThreshold: number | undefined;
    subtitle?: string;
    gradient: string;
  }[] = [];

  if (data.monthly?.milestones?.length > 0) {
    const earned = data.monthly.milestones.filter((m) => m.earned).length;
    tracks.push({
      label: "Monthly",
      postCount: data.monthly.postCount,
      earned,
      total: data.monthly.milestones.length,
      nextThreshold: data.monthly.nextMilestone?.threshold,
      subtitle: `${data.monthly.daysRemaining}d left`,
      gradient: "from-mint to-emerald-500",
    });
  }

  if (data.lifetime?.milestones?.length > 0) {
    const earned = data.lifetime.milestones.filter((m) => m.earned).length;
    tracks.push({
      label: "Lifetime",
      postCount: data.lifetime.postCount,
      earned,
      total: data.lifetime.milestones.length,
      nextThreshold: data.lifetime.nextMilestone?.threshold,
      gradient: "from-coral to-rose",
    });
  }

  if (tracks.length === 0) return null;

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-warm-gray-900 flex items-center gap-2">
          <Trophy size={18} className="text-coral" />
          Milestones
        </h3>
        <button
          onClick={onViewAll}
          className="text-sm text-coral hover:text-coral-dark transition-colors flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {tracks.map((track) => {
          const pct = track.nextThreshold
            ? Math.min((track.postCount / track.nextThreshold) * 100, 100)
            : 100;

          return (
            <div key={track.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warm-gray-700">
                    {track.label}
                  </span>
                  {track.subtitle && (
                    <span className="text-xs text-warm-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {track.subtitle}
                    </span>
                  )}
                </div>
                <span className="text-sm tabular-nums text-warm-gray-600">
                  <span className="font-semibold text-warm-gray-900">
                    {track.postCount}
                  </span>
                  {track.nextThreshold ? ` / ${track.nextThreshold}` : ""}
                </span>
              </div>

              <div className="h-2 bg-warm-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${track.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-warm-gray-400">
                  {track.earned}/{track.total} milestones earned
                </span>
                {track.earned > 0 && (
                  <span className="flex -space-x-0.5">
                    {Array.from({ length: Math.min(track.earned, 3) }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className="text-amber-400 fill-amber-400"
                        />
                      )
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Compact Portfolio Status ── */

function CompactPortfolioStatus({
  status,
  onManage,
}: {
  status: PortfolioStatus;
  onManage: () => void;
}) {
  return (
    <div className="bg-white rounded-[--radius-lg] border border-warm-gray-200 p-4 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          status.isActive ? "bg-mint/10" : "bg-amber-100"
        }`}
      >
        {status.isActive ? (
          <CheckCircle2 size={20} className="text-mint" />
        ) : (
          <AlertTriangle size={20} className="text-amber-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-warm-gray-900">
          Portfolio {status.isActive ? "Active" : "Inactive"}
        </p>
        <p className="text-sm text-warm-gray-500 truncate">
          {status.hasHostingReward
            ? "Free hosting unlocked via milestone"
            : status.isActive
              ? "Posting requirements met this month"
              : `${Math.max(0, status.requiredPostCount - status.monthlyPostCount)} more posts needed this month`}
        </p>
      </div>

      <button
        onClick={onManage}
        className="text-sm font-medium text-coral hover:text-coral-dark transition-colors flex-shrink-0"
      >
        Manage
      </button>
    </div>
  );
}


