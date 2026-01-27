"use client";

import { useState, useCallback, useRef } from "react";
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
} from "lucide-react";
import { templates, type PortfolioTemplate } from "@/lib/ai/templates";

type Step = "describe" | "template" | "generate" | "preview";

interface GeneratedContent {
  title?: string;
  tagline?: string;
  hero?: { headline?: string; subheadline?: string };
  about?: { title?: string; body?: string };
  services?: { title: string; description: string }[];
  work?: { title?: string; description?: string };
  contact?: { title?: string; body?: string; ctaText?: string };
  stats?: { value: string; label: string }[];
  socialLinks?: { platform: string; handle: string }[];
}

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

export default function AIGeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("describe");
  const [description, setDescription] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PortfolioTemplate | null>(null);
  const [generatedContent, setGeneratedContent] =
    useState<GeneratedContent | null>(null);
  const [refineFeedback, setRefineFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completion, setCompletion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamGenerate = useCallback(
    async (body: Record<string, unknown>) => {
      setError(null);
      setIsLoading(true);
      setCompletion("");

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
          setCompletion(fullText);
        }

        // Parse the final JSON
        try {
          const jsonMatch = fullText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setGeneratedContent(parsed);
            setStep("preview");
          }
        } catch {
          console.error("Failed to parse AI response");
          setError("Failed to parse generated content. Please try again.");
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
      action: "generate",
      description,
      niche: selectedNiche,
      templateId: selectedTemplate?.id,
    });
  }, [streamGenerate, description, selectedNiche, selectedTemplate]);

  const handleRefine = useCallback(async () => {
    if (!refineFeedback.trim() || !generatedContent) return;

    setStep("generate");
    await streamGenerate({
      action: "refine",
      currentContent: JSON.stringify(generatedContent, null, 2),
      feedback: refineFeedback,
    });
    setRefineFeedback("");
  }, [streamGenerate, generatedContent, refineFeedback]);

  const handleCreatePortfolio = async () => {
    if (!generatedContent || !selectedTemplate) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedContent.title || "My Portfolio",
          tagline: generatedContent.tagline,
          templateId: selectedTemplate.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portfolio");
      }

      const portfolio = await response.json();

      // Update sections with generated content
      const sectionsToUpdate = [];

      if (generatedContent.hero) {
        sectionsToUpdate.push({
          type: "hero",
          content: {
            title: generatedContent.hero.headline,
            subtitle: generatedContent.hero.subheadline,
          },
        });
      }

      if (generatedContent.about) {
        sectionsToUpdate.push({
          type: "about",
          content: {
            title: generatedContent.about.title,
            body: generatedContent.about.body,
          },
        });
      }

      if (generatedContent.contact) {
        sectionsToUpdate.push({
          type: "contact",
          content: {
            title: generatedContent.contact.title,
            body: generatedContent.contact.body,
            ctaText: generatedContent.contact.ctaText,
          },
        });
      }

      // Update sections via API
      for (const section of portfolio.sections || []) {
        const update = sectionsToUpdate.find((s) => s.type === section.type);
        if (update) {
          await fetch(`/api/portfolios/${portfolio.id}/sections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionId: section.id,
              content: update.content,
            }),
          });
        }
      }

      router.push(`/dashboard/portfolios/${portfolio.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsCreating(false);
    }
  };

  // Parse streaming content for live preview
  const parseStreamingContent = (): Partial<GeneratedContent> => {
    if (!completion) return {};
    try {
      const jsonMatch = completion.match(/\{[\s\S]*\}?/);
      if (jsonMatch) {
        // Try to parse even partial JSON
        let jsonStr = jsonMatch[0];
        // Close any unclosed braces for partial parsing
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonStr += "}";
        }
        return JSON.parse(jsonStr);
      }
    } catch {
      // Partial JSON is expected during streaming
    }
    return {};
  };

  const streamingContent = parseStreamingContent();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href="/dashboard/portfolios/new"
        className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-warm-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to options
      </Link>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["describe", "template", "generate", "preview"] as const).map(
          (s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-gradient-to-br from-coral to-rose text-white"
                    : ["describe", "template", "generate", "preview"].indexOf(
                          step
                        ) > i
                      ? "bg-mint text-warm-gray-900"
                      : "bg-warm-gray-100 text-warm-gray-400"
                }`}
              >
                {["describe", "template", "generate", "preview"].indexOf(step) >
                i ? (
                  <Check size={16} />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    ["describe", "template", "generate", "preview"].indexOf(
                      step
                    ) > i
                      ? "bg-mint"
                      : "bg-warm-gray-200"
                  }`}
                />
              )}
            </div>
          )
        )}
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
                Tell us about yourself
              </h1>
              <p className="text-warm-gray-500">
                Describe your content, niche, experience, and what makes you
                unique. The more detail, the better!
              </p>
            </div>

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
                  onClick={() => setStep("template")}
                  disabled={description.length < 10}
                  className="py-3 px-6 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Continue
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Template Selection */}
        {step === "template" && (
          <motion.div
            key="template"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
                Choose your style
              </h1>
              <p className="text-warm-gray-500">
                Select a template that matches your vibe. You can customize it
                later.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className={`text-left bg-white rounded-[--radius-xl] border-2 p-6 transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-rose shadow-[0_4px_20px_rgba(255,107,149,0.25)]"
                      : "border-warm-gray-200 hover:border-warm-gray-300"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-[--radius-lg] mb-4 flex items-center justify-center text-2xl"
                    style={{
                      backgroundColor: template.theme.primaryColor + "20",
                    }}
                  >
                    {template.preview === "minimal" && "✨"}
                    {template.preview === "bold" && "🎨"}
                    {template.preview === "elegant" && "🌸"}
                    {template.preview === "playful" && "⚡"}
                    {template.preview === "professional" && "💼"}
                  </div>
                  <h3 className="font-semibold text-warm-gray-900 mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-warm-gray-500">
                    {template.description}
                  </p>
                  {selectedTemplate?.id === template.id && (
                    <div className="mt-3 flex items-center gap-1 text-rose text-sm font-medium">
                      <Check size={16} />
                      Selected
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep("describe")}
                className="py-3 px-6 text-warm-gray-600 hover:text-warm-gray-900 font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <motion.button
                type="button"
                onClick={handleGenerate}
                disabled={!selectedTemplate}
                className="py-3 px-6 bg-gradient-to-br from-lavender to-purple-dark text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Sparkles size={18} />
                Generate with AI
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generating */}
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
                AI is crafting personalized content just for you
              </p>
            </div>

            {/* Live preview during generation */}
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 min-h-[400px]">
              <div className="space-y-6">
                {/* Hero preview */}
                {streamingContent.hero && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8 border-b border-warm-gray-100"
                  >
                    <h2 className="text-2xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
                      {streamingContent.hero.headline || "..."}
                    </h2>
                    <p className="text-warm-gray-500">
                      {streamingContent.hero.subheadline || "..."}
                    </p>
                  </motion.div>
                )}

                {/* About preview */}
                {streamingContent.about && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4"
                  >
                    <h3 className="font-semibold text-warm-gray-900 mb-2">
                      {streamingContent.about.title || "About"}
                    </h3>
                    <p className="text-warm-gray-600 text-sm line-clamp-4">
                      {streamingContent.about.body || "..."}
                    </p>
                  </motion.div>
                )}

                {/* Services preview */}
                {streamingContent.services &&
                  streamingContent.services.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-4"
                    >
                      <h3 className="font-semibold text-warm-gray-900 mb-3">
                        Services
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {streamingContent.services.map((service, i) => (
                          <div
                            key={i}
                            className="p-3 bg-warm-gray-50 rounded-[--radius-md]"
                          >
                            <p className="font-medium text-sm">
                              {service.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-lavender py-4">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm">Generating content...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Preview & Refine */}
        {step === "preview" && generatedContent && (
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
                  Review the generated content. You can refine it or create your
                  portfolio.
                </p>
              </div>
            </div>

            {/* Generated content preview */}
            <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
              {/* Hero Section */}
              <div
                className="p-12 text-center"
                style={{
                  backgroundColor:
                    selectedTemplate?.theme.primaryColor + "10" || "#FFF5F3",
                }}
              >
                <h2 className="text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-3">
                  {generatedContent.hero?.headline || generatedContent.title}
                </h2>
                <p className="text-lg text-warm-gray-600 max-w-xl mx-auto">
                  {generatedContent.hero?.subheadline ||
                    generatedContent.tagline}
                </p>
              </div>

              {/* About Section */}
              {generatedContent.about && (
                <div className="p-8 border-t border-warm-gray-100">
                  <h3 className="text-xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
                    {generatedContent.about.title}
                  </h3>
                  <div className="text-warm-gray-600 whitespace-pre-line">
                    {generatedContent.about.body}
                  </div>
                </div>
              )}

              {/* Services Section */}
              {generatedContent.services &&
                generatedContent.services.length > 0 && (
                  <div className="p-8 bg-warm-gray-50 border-t border-warm-gray-100">
                    <h3 className="text-xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4">
                      Services
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedContent.services.map((service, i) => (
                        <div
                          key={i}
                          className="p-4 bg-white rounded-[--radius-md] border border-warm-gray-200"
                        >
                          <h4 className="font-semibold text-warm-gray-900 mb-1">
                            {service.title}
                          </h4>
                          <p className="text-sm text-warm-gray-500">
                            {service.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Contact Section */}
              {generatedContent.contact && (
                <div
                  className="p-8 text-center"
                  style={{
                    backgroundColor:
                      selectedTemplate?.theme.primaryColor || "#FF6B95",
                    color: "#FFFFFF",
                  }}
                >
                  <h3 className="text-xl font-[family-name:var(--font-display)] mb-2">
                    {generatedContent.contact.title}
                  </h3>
                  <p className="mb-4 opacity-90">
                    {generatedContent.contact.body}
                  </p>
                  <span className="inline-block px-6 py-2 bg-white/20 rounded-full font-medium">
                    {generatedContent.contact.ctaText}
                  </span>
                </div>
              )}
            </div>

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
                  placeholder="e.g., Make the about section more casual, add more personality..."
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

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep("template")}
                className="py-3 px-6 text-warm-gray-600 hover:text-warm-gray-900 font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <motion.button
                type="button"
                onClick={handleCreatePortfolio}
                disabled={isCreating}
                className="py-3 px-6 bg-gradient-to-br from-coral to-rose text-white font-medium rounded-[--radius-md] shadow-[0_4px_20px_rgba(255,107,149,0.25)] hover:shadow-[0_8px_30px_rgba(255,107,149,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow flex items-center gap-2"
                whileHover={{ scale: isCreating ? 1 : 1.01 }}
                whileTap={{ scale: isCreating ? 1 : 0.99 }}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Portfolio...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Create Portfolio
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
