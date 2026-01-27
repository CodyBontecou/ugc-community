"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  Eye,
  EyeOff,
  Loader2,
  GripVertical,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Portfolio, PortfolioSection, Media } from "@/lib/db/schema";

interface PortfolioEditorProps {
  portfolio: Portfolio & {
    sections: PortfolioSection[];
    media: Media[];
  };
}

type SectionContent = Record<string, unknown>;

export function PortfolioEditor({ portfolio }: PortfolioEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(portfolio.title);
  const [tagline, setTagline] = useState(portfolio.tagline || "");
  const [sections, setSections] = useState(portfolio.sections);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    sections[0]?.id || null
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, tagline }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSuccess("Changes saved!");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolios/${portfolio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !portfolio.isPublished }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      setSuccess(
        portfolio.isPublished
          ? "Portfolio unpublished"
          : "Portfolio published!"
      );
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("Failed to update publish status");
    } finally {
      setIsPublishing(false);
    }
  };

  const updateSectionContent = (
    sectionId: string,
    field: string,
    value: string
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              content: {
                ...(s.content as SectionContent),
                [field]: value,
              },
            }
          : s
      )
    );
  };

  const getSectionTitle = (type: string): string => {
    const titles: Record<string, string> = {
      hero: "Hero Section",
      about: "About Section",
      work: "Work/Portfolio Section",
      contact: "Contact Section",
    };
    return titles[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-[--radius-md] text-red-700 text-sm"
        >
          {error}
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 border border-green-200 rounded-[--radius-md] text-green-700 text-sm"
        >
          {success}
        </motion.div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <h2 className="font-semibold text-warm-gray-900 mb-4">Basic Info</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
              Portfolio Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
              placeholder="UGC Creator | Beauty & Lifestyle"
              maxLength={200}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <h2 className="font-semibold text-warm-gray-900 mb-4">Sections</h2>
        <div className="space-y-3">
          {sections.map((section) => {
            const content = section.content as SectionContent;
            const isExpanded = expandedSection === section.id;

            return (
              <div
                key={section.id}
                className="border border-warm-gray-200 rounded-[--radius-lg] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(isExpanded ? null : section.id)
                  }
                  className="w-full flex items-center justify-between p-4 hover:bg-warm-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical
                      size={18}
                      className="text-warm-gray-400 cursor-grab"
                    />
                    <span className="font-medium text-warm-gray-900">
                      {getSectionTitle(section.type)}
                    </span>
                    {!section.isVisible && (
                      <span className="px-2 py-0.5 text-xs bg-warm-gray-100 text-warm-gray-500 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-warm-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-warm-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-warm-gray-200 p-4 space-y-4"
                  >
                    {section.type === "hero" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            Title
                          </label>
                          <input
                            type="text"
                            value={(content.title as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "title",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={(content.subtitle as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "subtitle",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                          />
                        </div>
                      </>
                    )}

                    {section.type === "about" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={(content.title as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "title",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            About Text
                          </label>
                          <textarea
                            value={(content.body as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "body",
                                e.target.value
                              )
                            }
                            rows={4}
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors resize-none"
                          />
                        </div>
                      </>
                    )}

                    {section.type === "work" && (
                      <div>
                        <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={(content.title as string) || ""}
                          onChange={(e) =>
                            updateSectionContent(
                              section.id,
                              "title",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                        />
                        <p className="mt-2 text-sm text-warm-gray-500">
                          Upload media in the Media section to display your work
                          here.
                        </p>
                      </div>
                    )}

                    {section.type === "contact" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            Section Title
                          </label>
                          <input
                            type="text"
                            value={(content.title as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "title",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-warm-gray-700 mb-1.5">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={(content.subtitle as string) || ""}
                            onChange={(e) =>
                              updateSectionContent(
                                section.id,
                                "subtitle",
                                e.target.value
                              )
                            }
                            className="w-full px-4 py-2 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors"
                            placeholder="I'd love to hear from you!"
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-[--radius-xl] border border-warm-gray-200 p-4">
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={`flex items-center gap-2 px-4 py-2 font-medium rounded-[--radius-md] transition-colors ${
            portfolio.isPublished
              ? "text-warm-gray-700 bg-warm-gray-100 hover:bg-warm-gray-200"
              : "text-green-700 bg-green-100 hover:bg-green-200"
          }`}
        >
          {isPublishing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : portfolio.isPublished ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
          {portfolio.isPublished ? "Unpublish" : "Publish"}
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 transition-shadow"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
