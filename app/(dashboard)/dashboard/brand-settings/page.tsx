"use client";

import { useState, useEffect } from "react";
import { Loader2, Bell, Mail, Check } from "lucide-react";

interface Preferences {
  emailOnJobApplication: boolean;
  emailOnApplicationUpdate: boolean;
}

export default function BrandSettingsPage() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences);
        } else {
          setError("Failed to load settings");
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleToggle = async (field: keyof Preferences) => {
    if (!preferences) return;

    const newValue = !preferences[field];
    setIsSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValue }),
      });

      if (response.ok) {
        setPreferences((prev) => (prev ? { ...prev, [field]: newValue } : prev));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError("Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Brand Settings
          </h1>
          <p className="text-warm-gray-600 mt-1">
            Manage your notification preferences
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Brand Settings
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-[--radius-lg] p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900">
            Brand Settings
          </h1>
          <p className="text-warm-gray-600 mt-1">
            Manage your notification preferences
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <Check size={16} />
            Saved
          </div>
        )}
      </div>

      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 divide-y divide-warm-gray-100">
        {/* Section header */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-warm-gray-400" />
            <h2 className="font-medium text-warm-gray-900">Email Notifications</h2>
          </div>
          <p className="text-sm text-warm-gray-500 mt-1">
            Choose which emails you receive
          </p>
        </div>

        {/* Toggle: Email on job application */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-warm-gray-900">New Applications</h3>
                <p className="text-sm text-warm-gray-500 mt-0.5">
                  Receive an email when a creator expresses interest in your job listing
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("emailOnJobApplication")}
              disabled={isSaving}
              className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-coral/20 ${
                preferences?.emailOnJobApplication
                  ? "bg-coral"
                  : "bg-warm-gray-200"
              } ${isSaving ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  preferences?.emailOnJobApplication
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Toggle: Email on application update */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-warm-gray-900">Application Updates</h3>
                <p className="text-sm text-warm-gray-500 mt-0.5">
                  Receive an email when there are updates to your applications (status changes)
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle("emailOnApplicationUpdate")}
              disabled={isSaving}
              className={`relative w-12 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-coral/20 ${
                preferences?.emailOnApplicationUpdate
                  ? "bg-coral"
                  : "bg-warm-gray-200"
              } ${isSaving ? "opacity-50" : ""}`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  preferences?.emailOnApplicationUpdate
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
