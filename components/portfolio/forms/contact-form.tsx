"use client";

import { useState } from "react";
import type { SectionContent } from "@/lib/db/schema";

interface ContactFormProps {
  content: SectionContent | undefined;
  onChange: (content: SectionContent) => void;
}

export function ContactForm({ content, onChange }: ContactFormProps) {
  const [formData, setFormData] = useState({
    title: content?.title ?? "Get in Touch",
    subtitle: content?.subtitle ?? "",
    email: content?.email ?? "",
    showForm: content?.showForm ?? true,
    showSocials: content?.showSocials ?? true,
    ctaText: content?.ctaText ?? "",
    ctaLink: content?.ctaLink ?? "",
  });

  function handleChange(key: keyof typeof formData, value: string | boolean) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Get in Touch"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            Subtitle (optional)
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="Let's work together"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Contact Email (optional override)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="Leave blank to use your account email"
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
        />
        <p className="mt-1 text-xs text-warm-gray-500">
          Override the email shown in the contact section
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            CTA Button Text (optional)
          </label>
          <input
            type="text"
            value={formData.ctaText}
            onChange={(e) => handleChange("ctaText", e.target.value)}
            placeholder="Book a Call"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            CTA Link
          </label>
          <input
            type="text"
            value={formData.ctaLink}
            onChange={(e) => handleChange("ctaLink", e.target.value)}
            placeholder="https://calendly.com/..."
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 p-3 bg-warm-gray-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showForm}
            onChange={(e) => handleChange("showForm", e.target.checked)}
            className="w-4 h-4 text-coral border-warm-gray-300 rounded focus:ring-coral/50"
          />
          <div>
            <span className="text-sm text-warm-gray-700">
              Show contact form
            </span>
            <p className="text-xs text-warm-gray-500">
              Allow visitors to send you messages directly
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-warm-gray-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showSocials}
            onChange={(e) => handleChange("showSocials", e.target.checked)}
            className="w-4 h-4 text-coral border-warm-gray-300 rounded focus:ring-coral/50"
          />
          <div>
            <span className="text-sm text-warm-gray-700">
              Show social links
            </span>
            <p className="text-xs text-warm-gray-500">
              Display your Instagram, TikTok, and other social profiles
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
