"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Loader2, Check, X, Pencil } from "lucide-react";

interface SubdomainInlineProps {
  initialSubdomain: string | null;
  domain?: string;
}

export function SubdomainInline({
  initialSubdomain,
  domain = "ugc.community",
}: SubdomainInlineProps) {
  const [isEditing, setIsEditing] = useState(!initialSubdomain);
  const [subdomain, setSubdomain] = useState(initialSubdomain || "");
  const [savedSubdomain, setSavedSubdomain] = useState(initialSubdomain);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(
    async (value: string) => {
      if (!value || value === savedSubdomain) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      try {
        const res = await fetch(
          `/api/user/subdomain?check=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setIsAvailable(data.available);
      } catch {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    },
    [savedSubdomain]
  );

  useEffect(() => {
    if (!subdomain || subdomain === savedSubdomain) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      checkAvailability(subdomain);
    }, 400);

    return () => clearTimeout(timer);
  }, [subdomain, savedSubdomain, checkAvailability]);

  const handleSave = async () => {
    if (!subdomain) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/user/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }

      setSavedSubdomain(data.subdomain);
      setSubdomain(data.subdomain);
      setIsAvailable(null);
      setIsEditing(false);
    } catch {
      setError("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSubdomain(savedSubdomain || "");
    setIsAvailable(null);
    setError(null);
    if (savedSubdomain) {
      setIsEditing(false);
    }
  };

  const canSave = subdomain && (isAvailable === true || subdomain === savedSubdomain);

  // Display mode - show current subdomain
  if (!isEditing && savedSubdomain) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-warm-gray-400" />
            <span className="text-sm font-medium text-warm-gray-900">Your URL</span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-warm-gray-400 hover:text-warm-gray-600 transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
        <a
          href={`https://${savedSubdomain}.${domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono text-lavender hover:text-purple-dark transition-colors break-all"
        >
          {savedSubdomain}.{domain}
        </a>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={16} className="text-warm-gray-400" />
        <span className="text-sm font-medium text-warm-gray-900">
          {savedSubdomain ? "Change URL" : "Claim your URL"}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className={`w-full px-3 py-2 text-sm border rounded-[--radius-md] pr-8 transition-colors ${
                isAvailable === true
                  ? "border-green-300 focus:ring-green-500/20"
                  : isAvailable === false
                    ? "border-red-300 focus:ring-red-500/20"
                    : "border-warm-gray-200 focus:ring-rose/20"
              } focus:outline-none focus:ring-2`}
              placeholder="yourname"
              disabled={isSaving}
              autoFocus
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isChecking && <Loader2 size={14} className="animate-spin text-warm-gray-400" />}
              {!isChecking && isAvailable === true && <Check size={14} className="text-green-500" />}
              {!isChecking && isAvailable === false && <X size={14} className="text-red-500" />}
            </div>
          </div>
          <span className="text-xs text-warm-gray-600 whitespace-nowrap">.{domain}</span>
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        {isAvailable === true && (
          <p className="text-xs text-green-600">Available!</p>
        )}

        {isAvailable === false && (
          <p className="text-xs text-red-600">Already taken</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving || isChecking}
            className="flex-1 px-3 py-2 text-sm font-medium bg-warm-gray-900 rounded-[--radius-md] hover:bg-warm-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            style={{ color: '#FFFFFF' }}
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </button>
          {savedSubdomain && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-3 py-2 text-sm font-medium text-warm-gray-600 hover:bg-warm-gray-100 rounded-[--radius-md] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
