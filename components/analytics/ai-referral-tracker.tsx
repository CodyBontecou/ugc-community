"use client";

import { useEffect } from "react";

const AI_REFERRERS: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "claude.ai": "claude",
  "copilot.microsoft.com": "copilot",
  "gemini.google.com": "gemini",
};

export default function AIReferralTracker() {
  useEffect(() => {
    if (!document.referrer) return;

    let hostname: string;
    try {
      hostname = new URL(document.referrer).hostname.toLowerCase();
    } catch {
      return;
    }

    const match = Object.entries(AI_REFERRERS).find(
      ([domain]) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
    if (!match) return;

    fetch("/api/analytics/ai-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: match[1], path: window.location.pathname }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
