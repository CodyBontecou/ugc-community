"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TYPING_TIMEOUT_MS } from "@/lib/messages/constants";

interface TypingUser {
  id: string;
  name: string;
  displayName: string | null;
  image: string | null;
}

interface UseTypingPollingResult {
  typingUsers: TypingUser[];
  setTyping: () => void;
}

const TYPING_POLL_INTERVAL = 2000; // Poll every 2 seconds
const TYPING_DEBOUNCE = 500; // Debounce typing indicator by 500ms

export function useTypingPolling(
  conversationId: string | null
): UseTypingPollingResult {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const lastTypingTime = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for typing indicators
  const pollTyping = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/messages/conversations/${conversationId}/typing`
      );

      if (response.ok) {
        const data = await response.json();
        setTypingUsers(data.typingUsers || []);
      }
    } catch (error) {
      console.error("Error polling typing indicators:", error);
    }
  }, [conversationId]);

  // Send typing indicator
  const setTyping = useCallback(() => {
    if (!conversationId) return;

    const now = Date.now();

    // Debounce - only send if enough time has passed
    if (now - lastTypingTime.current < TYPING_DEBOUNCE) {
      return;
    }

    lastTypingTime.current = now;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    fetch(`/api/messages/conversations/${conversationId}/typing`, {
      method: "POST",
    }).catch((err) => console.error("Error sending typing indicator:", err));

    // Auto-clear after timeout
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingTime.current = 0;
    }, TYPING_TIMEOUT_MS);
  }, [conversationId]);

  // Start/stop polling based on conversation
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    const startPolling = () => {
      pollTyping(); // Poll immediately
      pollIntervalRef.current = setInterval(pollTyping, TYPING_POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, pollTyping]);

  return {
    typingUsers,
    setTyping,
  };
}
