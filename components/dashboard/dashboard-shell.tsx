"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BarChart3,
  Globe,
  Image as ImageIcon,
} from "lucide-react";

import { OverviewTab } from "./overview-tab";
import { AnalyticsTab } from "./analytics-tab";
import { OnboardingForm } from "./onboarding-form";
import { PortfolioStatus } from "./portfolio-status";
import { RewardsOverview } from "@/components/milestones/RewardsOverview";
import { UserProgressionPath } from "@/components/milestones/UserProgressionPath";
import { MediaLibrary } from "@/components/media/media-library";

export type TabId = "overview" | "analytics" | "portfolio" | "media";

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "portfolio", label: "Portfolio", icon: Globe },
  { id: "media", label: "Media", icon: ImageIcon },
];

interface DashboardShellProps {
  userName: string;
}

export function DashboardShell({ userName }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const firstName = userName?.split(" ")[0] || "Creator";

  const handleNavigate = useCallback((tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-w-0 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="break-words text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Hey {firstName}!
        </h1>
        <p className="text-warm-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your content
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative mb-8">
        <div className="grid grid-cols-4 items-center gap-1 border-b border-warm-gray-200 sm:flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id)}
              aria-pressed={activeTab === tab.id}
              className={`relative flex min-w-0 flex-col sm:flex-row items-center gap-1 sm:gap-2 px-1 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "text-coral"
                  : "text-warm-gray-400 hover:text-warm-gray-700"
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="dashboard-active-tab"
                  className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-gradient-to-r from-coral to-rose rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {activeTab === "overview" && (
            <OverviewTab onNavigate={handleNavigate} />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab onNavigate={handleNavigate} />
          )}

          {activeTab === "portfolio" && (
            <div className="space-y-6">
              <PortfolioStatus />
              <OnboardingForm />
              <div id="milestone-progress">
                <UserProgressionPath />
              </div>
              <RewardsOverview />
            </div>
          )}

          {activeTab === "media" && (
            <div
              className="h-[max(32rem,calc(100dvh-16rem))] bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 overflow-hidden"
            >
              <MediaLibrary />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
