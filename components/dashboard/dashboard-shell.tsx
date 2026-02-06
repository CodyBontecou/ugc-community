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
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900">
          Hey {firstName}!
        </h1>
        <p className="text-warm-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your content
        </p>
      </div>

      {/* Tab Bar */}
      <div className="relative mb-8">
        <div className="flex items-center gap-1 border-b border-warm-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
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
              className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden"
              style={{
                height: "calc(100vh - 300px)",
                minHeight: "500px",
              }}
            >
              <MediaLibrary />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
