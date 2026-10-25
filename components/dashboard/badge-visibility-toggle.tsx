"use client";

import { useState } from "react";
import { Award, Eye, EyeOff, Loader2 } from "lucide-react";

interface BadgeVisibilityToggleProps {
  initialHideBadges: boolean;
}

export function BadgeVisibilityToggle({
  initialHideBadges,
}: BadgeVisibilityToggleProps) {
  const [hideBadges, setHideBadges] = useState(initialHideBadges);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function handleToggle() {
    const newValue = !hideBadges;
    setSaving(true);
    setJustSaved(false);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideBadges: newValue }),
      });

      if (response.ok) {
        setHideBadges(newValue);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
      }
    } catch {
      // Revert on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Award size={20} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-warm-gray-900">Badge Visibility</h3>
          <p className="text-sm text-warm-gray-500 mt-1">
            Control whether achievement badges are shown on your public profile
            and in the creator directory.
          </p>

          <button
            onClick={handleToggle}
            disabled={saving}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] border transition-all ${
              hideBadges
                ? "bg-warm-gray-50 border-warm-gray-200 text-warm-gray-700 hover:bg-warm-gray-100"
                : "bg-mint-soft/10 border-mint/20 text-mint hover:bg-mint-soft/20"
            }`}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : hideBadges ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}
            {hideBadges ? "Badges Hidden" : "Badges Visible"}
          </button>

          {justSaved && (
            <p className="text-xs text-mint mt-2 animate-in fade-in">
              ✓ Saved
            </p>
          )}

          {hideBadges && (
            <p className="text-xs text-warm-gray-400 mt-2">
              Your badges are currently hidden from your public profile and
              directory listing. You still earn them — they just won&apos;t be
              visible to others.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
