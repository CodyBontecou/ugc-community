"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type EarnedMilestone = {
  id: string;
  name: string;
  description: string | null;
  rewardType: string;
  type: "monthly" | "lifetime";
  threshold: number;
  earnedAt: string;
};

type MilestoneContextValue = {
  /** Queue of milestones waiting to be displayed */
  pendingMilestones: EarnedMilestone[];
  /** Currently displayed milestone (front of queue) */
  currentMilestone: EarnedMilestone | null;
  /** Add a milestone achievement to the celebration queue */
  showMilestoneAchievement: (milestone: EarnedMilestone) => void;
  /** Add multiple milestone achievements to the queue */
  showMilestoneAchievements: (milestones: EarnedMilestone[]) => void;
  /** Dismiss the current milestone and show the next one */
  dismissCurrentMilestone: () => void;
  /** Clear all pending milestones */
  clearAllMilestones: () => void;
  /** Check if a milestone has been seen before */
  hasSeenMilestone: (milestoneId: string, earnedAt: string) => boolean;
};

const MilestoneContext = createContext<MilestoneContextValue | null>(null);

const SEEN_MILESTONES_KEY = "ugc-seen-milestone-celebrations";

function getSeenMilestones(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(SEEN_MILESTONES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore localStorage errors
  }
  return new Set();
}

function addSeenMilestone(milestoneKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = getSeenMilestones();
    seen.add(milestoneKey);
    // Keep only the last 100 entries to prevent unbounded growth
    const arr = Array.from(seen);
    if (arr.length > 100) {
      arr.splice(0, arr.length - 100);
    }
    localStorage.setItem(SEEN_MILESTONES_KEY, JSON.stringify(arr));
  } catch {
    // Ignore localStorage errors
  }
}

function getMilestoneKey(milestoneId: string, earnedAt: string): string {
  return `${milestoneId}:${earnedAt}`;
}

export function MilestoneProvider({ children }: { children: ReactNode }) {
  const [pendingMilestones, setPendingMilestones] = useState<EarnedMilestone[]>(
    []
  );
  const [seenMilestones, setSeenMilestones] = useState<Set<string>>(new Set());

  // Load seen milestones from localStorage on mount
  useEffect(() => {
    setSeenMilestones(getSeenMilestones());
  }, []);

  const hasSeenMilestone = useCallback(
    (milestoneId: string, earnedAt: string): boolean => {
      return seenMilestones.has(getMilestoneKey(milestoneId, earnedAt));
    },
    [seenMilestones]
  );

  const showMilestoneAchievement = useCallback(
    (milestone: EarnedMilestone) => {
      const key = getMilestoneKey(milestone.id, milestone.earnedAt);
      if (seenMilestones.has(key)) {
        return; // Already seen, don't show again
      }
      setPendingMilestones((prev) => {
        // Avoid duplicates in queue
        if (prev.some((m) => getMilestoneKey(m.id, m.earnedAt) === key)) {
          return prev;
        }
        return [...prev, milestone];
      });
    },
    [seenMilestones]
  );

  const showMilestoneAchievements = useCallback(
    (milestones: EarnedMilestone[]) => {
      const newMilestones = milestones.filter((m) => {
        const key = getMilestoneKey(m.id, m.earnedAt);
        return !seenMilestones.has(key);
      });

      if (newMilestones.length === 0) return;

      setPendingMilestones((prev) => {
        const existingKeys = new Set(
          prev.map((m) => getMilestoneKey(m.id, m.earnedAt))
        );
        const uniqueNew = newMilestones.filter(
          (m) => !existingKeys.has(getMilestoneKey(m.id, m.earnedAt))
        );
        return [...prev, ...uniqueNew];
      });
    },
    [seenMilestones]
  );

  const dismissCurrentMilestone = useCallback(() => {
    setPendingMilestones((prev) => {
      if (prev.length === 0) return prev;
      const [dismissed, ...rest] = prev;
      // Mark as seen in localStorage
      addSeenMilestone(getMilestoneKey(dismissed.id, dismissed.earnedAt));
      setSeenMilestones((seen) => {
        const newSeen = new Set(seen);
        newSeen.add(getMilestoneKey(dismissed.id, dismissed.earnedAt));
        return newSeen;
      });
      return rest;
    });
  }, []);

  const clearAllMilestones = useCallback(() => {
    setPendingMilestones((prev) => {
      // Mark all as seen
      prev.forEach((m) => {
        addSeenMilestone(getMilestoneKey(m.id, m.earnedAt));
      });
      setSeenMilestones((seen) => {
        const newSeen = new Set(seen);
        prev.forEach((m) => {
          newSeen.add(getMilestoneKey(m.id, m.earnedAt));
        });
        return newSeen;
      });
      return [];
    });
  }, []);

  const currentMilestone =
    pendingMilestones.length > 0 ? pendingMilestones[0] : null;

  return (
    <MilestoneContext.Provider
      value={{
        pendingMilestones,
        currentMilestone,
        showMilestoneAchievement,
        showMilestoneAchievements,
        dismissCurrentMilestone,
        clearAllMilestones,
        hasSeenMilestone,
      }}
    >
      {children}
    </MilestoneContext.Provider>
  );
}

export function useMilestones(): MilestoneContextValue {
  const context = useContext(MilestoneContext);
  if (!context) {
    throw new Error("useMilestones must be used within a MilestoneProvider");
  }
  return context;
}
