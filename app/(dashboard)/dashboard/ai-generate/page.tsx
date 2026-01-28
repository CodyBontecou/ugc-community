"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  RefreshCw,
  Wand2,
  Monitor,
  Tablet,
  Smartphone,
  AlertTriangle,
} from "lucide-react";

type Step = "describe" | "generate" | "preview";
type PreviewSize = "mobile" | "tablet" | "desktop";

const NICHES = [
  { id: "beauty", label: "Beauty & Skincare" },
  { id: "fashion", label: "Fashion & Style" },
  { id: "food", label: "Food & Cooking" },
  { id: "fitness", label: "Fitness & Wellness" },
  { id: "tech", label: "Tech & Gaming" },
  { id: "lifestyle", label: "Home & Lifestyle" },
  { id: "parenting", label: "Parenting & Family" },
  { id: "travel", label: "Travel & Adventure" },
];

const PREVIEW_SIZES = {
  mobile: { width: 375, height: 667, label: "Mobile" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
};

interface ExistingPortfolio {
  id: string;
  title: string;
  portfolioType: string;
  htmlContent: string | null;
  isPublished: boolean;
}

export default function AIGeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>("");
  const [refineFeedback, setRefineFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingHtml, setStreamingHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");
  const [existingPortfolio, setExistingPortfolio] = useState<ExistingPortfolio | null>(null);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for existing portfolio on mount
  useEffect(() => {
    async function checkExistingPortfolio() {
      try {
        const response = await fetch("/api/portfolio");
        if (response.ok) {
          const portfolio = await response.json();
          if (portfolio) {
            setExistingPortfolio(portfolio);
          }
        }
      } catch {
        // Ignore errors - portfolio may not exist
      }
    }
    checkExistingPortfolio();
  }, []);

  const streamGenerate = useCallback(
    async (body: Record<string, unknown>) => {
      setError(null);
      setIsLoading(true);
      setStreamingHtml("");

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate content");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamingHtml(fullText);
        }

        // Validate HTML - should start with <!DOCTYPE html>
        const trimmedHtml = fullText.trim();
        if (trimmedHtml.toLowerCase().startsWith("<!doctype html>")) {
          setGeneratedHtml(trimmedHtml);
          setStep("preview");
        } else {
          // Try to extract HTML from the response
          const htmlMatch = fullText.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
          if (htmlMatch) {
            setGeneratedHtml(htmlMatch[0]);
            setStep("preview");
          } else {
            setError("Failed to generate valid HTML. Please try again.");
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Ignore abort errors
        }
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    setStep("generate");
    await streamGenerate({
      action: "generate-html",
      description,
      niche: selectedNiche,
    });
  }, [streamGenerate, description, selectedNiche]);

  const handleRefine = useCallback(async () => {
    if (!refineFeedback.trim() || !generatedHtml) return;

    setStep("generate");
    await streamGenerate({
      action: "refine-html",
      currentHtml: generatedHtml,
      feedback: refineFeedback,
    });
    setRefineFeedback("");
  }, [streamGenerate, generatedHtml, refineFeedback]);

  const handleSavePortfolio = async () => {
    if (!generatedHtml) return;

    // Show warning if portfolio exists and has content
    if (existingPortfolio && !showOverwriteWarning) {
      setShowOverwriteWarning(true);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Extract title from HTML
      const titleMatch = generatedHtml.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : "My Portfolio";

      // Update existing portfolio with new HTML content
      const response = await fetch("/api/portfolio", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          htmlContent: generatedHtml,
          portfolioType: "html",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save portfolio");
      }

      router.push("/dashboard/portfolio");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSaving(false);
      setShowOverwriteWarning(false);
    }
  };

  const currentSize = PREVIEW_SIZES[previewSize];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-warm-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </Link>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["describe", "generate", "preview"] as const).map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s
                  ? "bg-gradient-to-br from-coral to-rose text-white"
                  : ["describe", "generate", "preview"].indexOf(step) > i
                    ? "bg-mint text-warm-gray-900"
                    : "bg-warm-gray-100 text-warm-gray-400"
              }`}
            >
              {["describe", "generate", "preview"].indexOf(step) > i ? (
                <Check size={16} />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  ["describe", "generate", "preview"].indexOf(step) > i
                    ? "bg-mint"
                    : "bg-warm-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[--radius-md] text-red-700"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Describe */}
        {step === "describe" && (
          <motion.div
            key="describe"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
                {existingPortfolio ? "Redesign Your Portfolio" : "Create Your Portfolio"}
              </h1>
              <p className="text-warm-gray-500">
                Describe your content, niche, experience, and what makes you
                unique. Our AI will create a stunning, custom portfolio just for
                you.
              </p>
            </div>

            {/* Existing portfolio warning */}
            {existingPortfolio && existingPortfolio.htmlContent && (
              <div className="bg-amber-50 border border-amber-200 rounded-[--radius-md] p-4 flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    You already have a portfolio
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Generating a new portfolio will replace your existing one. Make sure you want to do this.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 space-y-6">
              {/* Niche selection */}
              <div>
                <label className="block text-sm font-medium text-warm-gray-700 mb-3">
                  Select your niche
                </label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((niche) => (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() =>
                        setSelectedNiche(
                          selectedNiche === niche.id ? null : niche.id
                        )
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedNiche === niche.id
                          ? "bg-gradient-to-br from-coral to-rose text-white"
                          : "bg-warm-gray-100 text-warm-gray-600 hover:bg-warm-gray-200"
                      }`}
                    >
                      {niche.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description textarea */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-warm-gray-700 mb-1.5"
                >
                  Describe yourself and your content
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose transition-colors resize-none"
                  placeholder="Example: I'm a beauty content creator focused on skincare. I've been creating UGC for 2 years and have worked with brands like Glossier and The Ordinary. I specialize in before/after transformation content and honest product reviews. My audience loves my relatable, no-filter approach to skincare. I have 15K followers on Instagram and 25K on TikTok."
                  maxLength={2000}
                />
                <p className="mt-1.5 text-xs text-warm-gray-400">
                  {description.length}/2000 characters
                </p>
              </div>

              <div className="flex justify-end">
                <motion.button
                  type="button"
                  onClick={handleGenerate}
                  disabled={description.length < 10}
                  className="py-3 px-6 bg-gradient-to-br from-lavender to-purple-dark text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Sparkles size={18} />
                  Generate Portfolio
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Generating */}
        {step === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-lavender to-purple-dark flex items-center justify-center">
                <Wand2 size={28} className="text-white animate-pulse" />
              </div>
              <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
                Creating your portfolio...
              </h1>
              <p className="text-warm-gray-500">
                AI is designing a custom portfolio just for you
              </p>
            </div>

            {/* Live preview during generation */}
            <div className="bg-warm-gray-900 rounded-[--radius-xl] p-4 min-h-[500px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center gap-2 text-lavender">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Generating...</span>
                </div>
              </div>

              {/* Streaming HTML preview in iframe */}
              <div className="bg-white rounded-lg overflow-hidden h-[450px]">
                {streamingHtml ? (
                  <iframe
                    srcDoc={streamingHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                    title="Portfolio Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-warm-gray-400">
                    <div className="text-center">
                      <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                      <p>Initializing...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview & Refine */}
        {step === "preview" && generatedHtml && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
                  Preview your portfolio
                </h1>
                <p className="text-warm-gray-500">
                  Review your generated portfolio. You can refine it or save it.
                </p>
              </div>

              {/* Responsive preview controls */}
              <div className="flex items-center gap-1 bg-warm-gray-100 p-1 rounded-[--radius-md]">
                <button
                  type="button"
                  onClick={() => setPreviewSize("mobile")}
                  className={`p-2 rounded-[--radius-sm] transition-colors ${
                    previewSize === "mobile"
                      ? "bg-white text-warm-gray-900 shadow-sm"
                      : "text-warm-gray-500 hover:text-warm-gray-700"
                  }`}
                  title="Mobile preview"
                >
                  <Smartphone size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSize("tablet")}
                  className={`p-2 rounded-[--radius-sm] transition-colors ${
                    previewSize === "tablet"
                      ? "bg-white text-warm-gray-900 shadow-sm"
                      : "text-warm-gray-500 hover:text-warm-gray-700"
                  }`}
                  title="Tablet preview"
                >
                  <Tablet size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSize("desktop")}
                  className={`p-2 rounded-[--radius-sm] transition-colors ${
                    previewSize === "desktop"
                      ? "bg-white text-warm-gray-900 shadow-sm"
                      : "text-warm-gray-500 hover:text-warm-gray-700"
                  }`}
                  title="Desktop preview"
                >
                  <Monitor size={18} />
                </button>
              </div>
            </div>

            {/* Preview iframe with responsive sizing */}
            <div className="bg-warm-gray-100 rounded-[--radius-xl] p-6 flex items-center justify-center min-h-[600px]">
              <div
                className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
                style={{
                  width: `${currentSize.width}px`,
                  height: `${currentSize.height}px`,
                  maxWidth: "100%",
                  maxHeight: "70vh",
                }}
              >
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                  title="Portfolio Preview"
                  style={{
                    transform:
                      previewSize !== "desktop"
                        ? `scale(${Math.min(1, 800 / currentSize.width)})`
                        : "none",
                    transformOrigin: "top left",
                  }}
                />
              </div>
            </div>

            {/* Size indicator */}
            <p className="text-center text-sm text-warm-gray-400">
              {currentSize.label} ({currentSize.width} x {currentSize.height}px)
            </p>

            {/* Refine section */}
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
              <h3 className="font-semibold text-warm-gray-900 mb-3">
                Want to make changes?
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={refineFeedback}
                  onChange={(e) => setRefineFeedback(e.target.value)}
                  placeholder="e.g., Use warmer colors, make the hero section bigger, add more whitespace..."
                  className="flex-1 px-4 py-3 border border-warm-gray-200 rounded-[--radius-md] text-warm-gray-900 placeholder:text-warm-gray-400 focus:outline-none focus:ring-2 focus:ring-lavender/20 focus:border-lavender transition-colors"
                />
                <motion.button
                  type="button"
                  onClick={handleRefine}
                  disabled={!refineFeedback.trim() || isLoading}
                  className="py-3 px-6 bg-warm-gray-100 text-warm-gray-700 font-medium rounded-[--radius-md] hover:bg-warm-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <RefreshCw size={18} />
                  Refine
                </motion.button>
              </div>
            </div>

            {/* Overwrite confirmation */}
            {showOverwriteWarning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-[--radius-md] p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      This will replace your existing portfolio
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your current portfolio will be permanently replaced with this new AI-generated design.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowOverwriteWarning(false)}
                        className="px-4 py-2 text-sm font-medium text-warm-gray-700 bg-white border border-warm-gray-200 rounded-[--radius-md] hover:bg-warm-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePortfolio}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-[--radius-md] hover:bg-amber-700 transition-colors flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Yes, Replace Portfolio"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            {!showOverwriteWarning && (
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep("describe")}
                  className="py-3 px-6 text-warm-gray-600 hover:text-warm-gray-900 font-medium transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Start Over
                </button>
                <motion.button
                  type="button"
                  onClick={handleSavePortfolio}
                  disabled={isSaving}
                  className="py-3 px-6 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
                  whileHover={{ scale: isSaving ? 1 : 1.01 }}
                  whileTap={{ scale: isSaving ? 1 : 0.99 }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Save Portfolio
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
