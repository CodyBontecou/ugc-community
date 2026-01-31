"use client";

import { useState, useEffect, useCallback } from "react";

const UNREAD_POLL_INTERVAL = 30000; // Poll every 30 seconds

interface UseUnreadCountResult {
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useUnreadCount(): UseUnreadCountResult {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/conversations?limit=0");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.totalUnread || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      fetchUnreadCount(); // Fetch immediately
      pollInterval = setInterval(fetchUnreadCount, UNREAD_POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    const handleFocus = () => {
      fetchUnreadCount(); // Refresh on focus
    };

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    isLoading,
    refresh,
  };
}
