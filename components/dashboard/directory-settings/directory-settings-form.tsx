"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { NicheSelector } from "./niche-selector";
import {
  RATE_RANGES,
  RATE_RANGE_LABELS,
  RATE_RANGE_DESCRIPTIONS,
  type Niche,
  type RateRange,
} from "@/lib/directory/constants";

interface DirectorySettings {
  directoryListed: boolean;
  availableForHire: boolean;
  niches: string[] | null;
  locationCity: string | null;
  locationCountry: string | null;
  rateRange: string | null;
  tagline: string | null;
  directoryJoinedAt: string | null;
  subdomain: string | null;
  displayName: string | null;
  name: string;
  image: string | null;
  bio: string | null;
}

export function DirectorySettingsForm() {
  const [settings, setSettings] = useState<DirectorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [directoryListed, setDirectoryListed] = useState(false);
  const [availableForHire, setAvailableForHire] = useState(true);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [rateRange, setRateRange] = useState<RateRange | "">("");
  const [tagline, setTagline] = useState("");

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/user/directory");
        if (response.ok) {
          const data: DirectorySettings = await response.json();
          setSettings(data);
          setDirectoryListed(data.directoryListed);
          setAvailableForHire(data.availableForHire);
          setNiches((data.niches as Niche[]) || []);
          setLocationCity(data.locationCity || "");
          setLocationCountry(data.locationCountry || "");
          setRateRange((data.rateRange as RateRange) || "");
          setTagline(data.tagline || "");
        }
      } catch {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const response = await fetch("/api/user/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directoryListed,
          availableForHire,
          niches,
          locationCity: locationCity || null,
          locationCountry: locationCountry || null,
          rateRange: rateRange || null,
          tagline: tagline || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-warm-gray-200 rounded w-1/3" />
          <div className="h-24 bg-warm-gray-100 rounded-lg" />
          <div className="h-24 bg-warm-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const hasSubdomain = settings?.subdomain;

  return (
    <div className="space-y-6">
      {/* Directory Listing Toggle */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-warm-gray-900 flex items-center gap-2">
              {directoryListed ? (
                <Eye size={18} className="text-mint" />
              ) : (
                <EyeOff size={18} className="text-warm-gray-400" />
              )}
              Directory Listing
            </h3>
            <p className="text-sm text-warm-gray-500 mt-1">
              {directoryListed
                ? "Your profile is visible in the creator directory"
                : "Your profile is hidden from the directory"}
            </p>
          </div>

          <button
            onClick={() => setDirectoryListed(!directoryListed)}
            disabled={!hasSubdomain}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lavender focus:ring-offset-2 ${
              directoryListed ? "bg-mint" : "bg-warm-gray-200"
            } ${!hasSubdomain ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                directoryListed ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {!hasSubdomain && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              You need to set up a subdomain before joining the directory.
            </p>
          </div>
        )}
      </div>

      {/* Rest of settings - only show if listing is enabled */}
      {directoryListed && (
        <>
          {/* Availability Toggle */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-warm-gray-900">
                  Available for Hire
                </h3>
                <p className="text-sm text-warm-gray-500 mt-1">
                  Show brands that you're currently accepting new projects
                </p>
              </div>

              <button
                onClick={() => setAvailableForHire(!availableForHire)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-lavender focus:ring-offset-2 ${
                  availableForHire ? "bg-mint" : "bg-warm-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    availableForHire ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Tagline */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <label className="block text-sm font-medium text-warm-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={160}
              placeholder="A short description that appears on your directory card"
              className="w-full px-4 py-2.5 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender"
            />
            <p className="text-xs text-warm-gray-500 mt-1.5">
              {tagline.length}/160 characters
            </p>
          </div>

          {/* Niches */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <NicheSelector
              selected={niches}
              onChange={setNiches}
              maxNiches={5}
            />
          </div>

          {/* Location */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h3 className="font-semibold text-warm-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Los Angeles"
                  className="w-full px-4 py-2.5 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  placeholder="United States"
                  className="w-full px-4 py-2.5 bg-white border border-warm-gray-200 rounded-lg text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender"
                />
              </div>
            </div>
          </div>

          {/* Rate Range */}
          <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
            <h3 className="font-semibold text-warm-gray-900 mb-4">
              Rate Range
              <span className="text-sm font-normal text-warm-gray-500 ml-2">
                (optional)
              </span>
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setRateRange("")}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  rateRange === ""
                    ? "bg-lavender/10 border-lavender"
                    : "bg-white border-warm-gray-200 hover:border-warm-gray-300"
                }`}
              >
                <span className="font-medium text-warm-gray-900">
                  Prefer not to say
                </span>
                <p className="text-sm text-warm-gray-500">
                  Don't show a rate range on my profile
                </p>
              </button>

              {RATE_RANGES.map((range) => (
                <button
                  key={range}
                  onClick={() => setRateRange(range)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    rateRange === range
                      ? "bg-lavender/10 border-lavender"
                      : "bg-white border-warm-gray-200 hover:border-warm-gray-300"
                  }`}
                >
                  <span className="font-medium text-warm-gray-900">
                    {RATE_RANGE_LABELS[range]}
                  </span>
                  <p className="text-sm text-warm-gray-500">
                    {RATE_RANGE_DESCRIPTIONS[range]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check size={18} />
              Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
