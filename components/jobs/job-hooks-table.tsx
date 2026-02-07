"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Hash,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

interface HookRow {
  id: string;
  hookText: string;
  screenshotUrl: string | null;
  sortOrder: number;
}

interface JobHooksTableProps {
  jobId: string;
  /** Legacy hooks from the contentJobs.hooks jsonb field (fallback) */
  legacyHooks?: string[];
}

export function JobHooksTable({ jobId, legacyHooks = [] }: JobHooksTableProps) {
  const [hooks, setHooks] = useState<HookRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHooks = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/hooks`);
      if (res.ok) {
        const data = await res.json();
        setHooks(data.hooks);
      }
    } catch {
      // Silently fail — we'll fall back to legacy hooks
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchHooks();
  }, [fetchHooks]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard not available
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-warm-gray-300" />
      </div>
    );
  }

  // If structured hooks exist, use them. Otherwise fall back to legacy.
  const hasStructuredHooks = hooks.length > 0;
  const hasLegacyHooks = legacyHooks.length > 0;

  if (!hasStructuredHooks && !hasLegacyHooks) return null;

  // Render structured hooks table
  if (hasStructuredHooks) {
    return (
      <div className="p-8 border-b border-warm-gray-100">
        <h2 className="text-lg font-semibold text-warm-gray-900 mb-1 flex items-center gap-2">
          <Hash size={18} className="text-coral" />
          Hooks &amp; Inspiration
        </h2>
        <p className="text-sm text-warm-gray-500 mb-5">
          Use these hooks in your content — copy them directly or use as starting inspiration.
        </p>

        <div className="border border-warm-gray-200 rounded-[--radius-lg] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-warm-gray-50/80 border-b border-warm-gray-200">
                <th className="text-left text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-5 py-3 w-10">
                  #
                </th>
                <th className="text-left text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-5 py-3">
                  Hook
                </th>
                <th className="text-center text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-5 py-3 w-28">
                  Reference
                </th>
                <th className="text-center text-xs font-semibold text-warm-gray-500 uppercase tracking-wider px-5 py-3 w-20">
                  Copy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-gray-100">
              {hooks.map((hook, i) => (
                <tr
                  key={hook.id}
                  className="group hover:bg-coral/[0.02] transition-colors"
                >
                  <td className="px-5 py-4 text-sm font-medium text-coral/60">
                    {i + 1}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-warm-gray-800 leading-relaxed">
                      &ldquo;{hook.hookText}&rdquo;
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {hook.screenshotUrl ? (
                      <a
                        href={hook.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-coral hover:text-coral/80 bg-coral/5 hover:bg-coral/10 px-2.5 py-1.5 rounded-full transition-colors"
                      >
                        <img
                          src={hook.screenshotUrl}
                          alt=""
                          className="w-6 h-6 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        View
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-xs text-warm-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => copyToClipboard(hook.hookText, hook.id)}
                      className="inline-flex items-center justify-center p-1.5 text-warm-gray-400 hover:text-coral hover:bg-coral/5 rounded-[--radius-md] transition-colors"
                      title="Copy hook text"
                    >
                      {copiedId === hook.id ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: render legacy hooks as before
  return (
    <div className="p-8 border-b border-warm-gray-100">
      <h2 className="text-lg font-semibold text-warm-gray-900 mb-1 flex items-center gap-2">
        <Hash size={18} className="text-coral" />
        Talking Points
      </h2>
      <p className="text-sm text-warm-gray-500 mb-4">
        Use these angles in your TikTok content for inspiration.
      </p>
      <div className="space-y-3">
        {legacyHooks.map((hook, i) => (
          <div
            key={i}
            className="flex items-start gap-3 bg-gradient-to-r from-coral/5 to-rose/5 border border-coral/10 rounded-[--radius-lg] px-5 py-4"
          >
            <span className="text-coral font-bold text-sm mt-0.5">
              {i + 1}.
            </span>
            <span className="text-warm-gray-800 font-medium flex-1">
              &ldquo;{hook}&rdquo;
            </span>
            <button
              onClick={() => copyToClipboard(hook, `legacy-${i}`)}
              className="p-1 text-warm-gray-400 hover:text-coral transition-colors"
              title="Copy"
            >
              {copiedId === `legacy-${i}` ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
