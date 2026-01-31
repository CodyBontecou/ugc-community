"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { POLL_INTERVAL_MS } from "@/lib/messages/constants";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  replyToId: string | null;
  metadata: Record<string, unknown>;
  editedAt: Date | null;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    displayName: string | null;
    image: string | null;
    role: string;
  };
}

interface Reaction {
  id: string;
  messageId: string;
  emoji: string;
  userId: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    displayName: string | null;
  };
}

interface UseMessagePollingResult {
  messages: Message[];
  newReactions: Reaction[];
  isPolling: boolean;
  lastUpdated: Date | null;
  error: Error | null;
}

export function useMessagePolling(
  conversationId: string | null,
  initialMessages: Message[] = []
): UseMessagePollingResult {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newReactions, setNewReactions] = useState<Reaction[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const lastPollTime = useRef<Date>(new Date());
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
    if (initialMessages.length > 0) {
      const latestTime = new Date(
        Math.max(...initialMessages.map((m) => new Date(m.createdAt).getTime()))
      );
      lastPollTime.current = latestTime;
    }
  }, [initialMessages]);

  const poll = useCallback(async () => {
    if (!conversationId) return;

    try {
      const since = lastPollTime.current.toISOString();
      const response = await fetch(
        `/api/messages/updates?conversationId=${conversationId}&since=${since}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }

      const data = await response.json();
      const now = new Date();

      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          // Merge new messages, avoiding duplicates
          const existingIds = new Set(prev.map((m) => m.id));
          const newMessages = data.messages.filter(
            (m: Message) => !existingIds.has(m.id)
          );
          return [...prev, ...newMessages];
        });
      }

      if (data.reactions && data.reactions.length > 0) {
        setNewReactions(data.reactions);
      }

      lastPollTime.current = now;
      setLastUpdated(now);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Polling failed"));
    }
  }, [conversationId]);

  // Start/stop polling based on visibility
  useEffect(() => {
    if (!conversationId) {
      setIsPolling(false);
      return;
    }

    const startPolling = () => {
      setIsPolling(true);
      poll(); // Poll immediately
      pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      setIsPolling(false);
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

    // Start polling if page is visible
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [conversationId, poll]);

  return {
    messages,
    newReactions,
    isPolling,
    lastUpdated,
    error,
  };
}
