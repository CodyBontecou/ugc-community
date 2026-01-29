"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  Check,
  X,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface SubdomainSettingsProps {
  initialSubdomain: string | null;
}

interface CheckResult {
  available?: boolean;
  reason?: string;
  suggestions?: string[];
  normalized?: string;
  url?: string;
}

export function SubdomainSettings({
  initialSubdomain,
}: SubdomainSettingsProps) {
  const [subdomain, setSubdomain] = useState(initialSubdomain || "");
  const [savedSubdomain, setSavedSubdomain] = useState(initialSubdomain);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const domain = process.env.NEXT_PUBLIC_DOMAIN || "ugc.community";

  // Debounced availability check
  const checkAvailability = useCallback(
    async (value: string) => {
      if (!value || value === savedSubdomain) {
        setCheckResult(null);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/user/subdomain?check=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        setCheckResult(data);
      } catch {
        setError("Failed to check availability");
      } finally {
        setIsChecking(false);
      }
    },
    [savedSubdomain]
  );

  // Debounce the check
  useEffect(() => {
    if (!subdomain || subdomain === savedSubdomain) {
      setCheckResult(null);
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
    setSuccess(null);

    try {
      const res = await fetch("/api/user/subdomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save subdomain");
        if (data.suggestions) {
          setCheckResult({
            available: false,
            reason: data.error,
            suggestions: data.suggestions,
          });
        }
        return;
      }

      setSavedSubdomain(data.subdomain);
      setSubdomain(data.subdomain);
      setCheckResult(null);
      setSuccess("Subdomain saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to save subdomain");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!savedSubdomain) return;

    setIsReleasing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/subdomain", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to release subdomain");
        return;
      }

      setSavedSubdomain(null);
      setSubdomain("");
      setCheckResult(null);
      setSuccess("Subdomain released successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to release subdomain");
    } finally {
      setIsReleasing(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSubdomain(suggestion);
    setCheckResult(null);
  };

  const isValid = checkResult?.available === true;
  const isTaken = checkResult?.available === false && checkResult?.reason;
  const hasChanges = subdomain !== (savedSubdomain || "");
  const canSave = hasChanges && (isValid || subdomain === savedSubdomain);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[--radius-lg] bg-lavender-soft/30 flex items-center justify-center text-lavender shrink-0">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-warm-gray-900">
            Custom Subdomain
          </h2>
          <p className="text-sm text-warm-gray-500 mt-1">
            Claim a custom subdomain for your profile. Your profile will be
            accessible at{" "}
            <span className="font-medium text-warm-gray-700">
              yourname.{domain}
            </span>
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-red-700 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-green-50 border border-green-200 rounded-[--radius-md] text-green-700 text-sm flex items-center gap-2"
          >
            <Check size={16} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="subdomain"
            className="block text-sm font-medium text-warm-gray-700 mb-1.5"
          >
            Subdomain
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="subdomain"
                type="text"
                value={subdomain}
                onChange={(e) =>
                  setSubdomain(e.target.value.toLowerCase().trim())
                }
                className={`w-full px-4 py-3 border rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  isValid
                    ? "border-green-300 focus:ring-green-500/20 focus:border-green-500"
                    : isTaken
                      ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                      : "border-warm-gray-200 focus:ring-rose/20 focus:border-rose"
                }`}
                placeholder="yourname"
                disabled={isSaving || isReleasing}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking && (
                  <Loader2 size={18} className="animate-spin text-warm-gray-400" />
                )}
                {!isChecking && isValid && (
                  <Check size={18} className="text-green-500" />
                )}
                {!isChecking && isTaken && (
                  <X size={18} className="text-red-500" />
                )}
              </div>
            </div>
            <span className="text-warm-gray-500 font-medium whitespace-nowrap">
              .{domain}
            </span>
          </div>

          {/* Status message */}
          <AnimatePresence mode="wait">
            {checkResult && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`text-sm mt-2 ${
                  isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {isValid
                  ? "This subdomain is available!"
                  : checkResult.reason || "This subdomain is not available"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* URL Preview */}
        {subdomain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-warm-gray-50 rounded-[--radius-md] border border-warm-gray-200"
          >
            <p className="text-sm text-warm-gray-500 mb-1">
              Your profile URL will be:
            </p>
            <p className="font-medium text-warm-gray-900 flex items-center gap-2">
              https://{subdomain}.{domain}
              {savedSubdomain === subdomain && (
                <a
                  href={`https://${subdomain}.${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose hover:text-rose/80 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </p>
          </motion.div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {checkResult?.suggestions && checkResult.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-sm text-warm-gray-600">
                Try one of these available alternatives:
              </p>
              <div className="flex flex-wrap gap-2">
                {checkResult.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1.5 text-sm font-medium bg-lavender-soft/30 text-lavender hover:bg-lavender-soft/50 rounded-[--radius-md] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <motion.button
            onClick={handleSave}
            disabled={!canSave || isSaving || isChecking}
            className="px-4 py-2.5 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
            whileHover={{ scale: isSaving ? 1 : 1.01 }}
            whileTap={{ scale: isSaving ? 1 : 0.99 }}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Subdomain"
            )}
          </motion.button>

          {savedSubdomain && (
            <motion.button
              onClick={handleRelease}
              disabled={isReleasing}
              className="px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium rounded-[--radius-md] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isReleasing ? 1 : 1.01 }}
              whileTap={{ scale: isReleasing ? 1 : 0.99 }}
            >
              {isReleasing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Release Subdomain
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {savedSubdomain && (
        <div className="pt-4 border-t border-warm-gray-200">
          <p className="text-sm text-warm-gray-500">
            Your current subdomain:{" "}
            <span className="font-medium text-warm-gray-900">
              {savedSubdomain}.{domain}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
