"use client";

import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/cody-isolated/30min";

const EXAMPLE_VISION = `I want a clean, modern portfolio that showcases my lifestyle and beauty content. I'd love a grid layout for my videos with a soft, warm color palette. I want visitors to immediately see my best work and understand my style. A simple contact form would be great so brands can reach out easily.`;

interface OnboardingFormProps {
  onSubmitSuccess?: () => void;
}

export function OnboardingForm({ onSubmitSuccess }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [portfolioVision, setPortfolioVision] = useState("");
  const [inspiringBrands, setInspiringBrands] = useState("");
  const [portfolioExamples, setPortfolioExamples] = useState("");

  // Check if user has already submitted
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          const data = await response.json();
          setHasSubmitted(data.hasSubmitted);
          if (data.questionnaire) {
            setPortfolioVision(data.questionnaire.portfolioVision || "");
            setInspiringBrands(data.questionnaire.inspiringBrands || "");
            setPortfolioExamples(data.questionnaire.portfolioExamples || "");
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioVision,
          inspiringBrands,
          portfolioExamples,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit");
        return;
      }

      setHasSubmitted(true);
      setSuccessMessage(hasSubmitted ? "Updated!" : "Submitted!");
      onSubmitSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-coral/10 via-rose/10 to-violet/10 p-6 border-b border-coral/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-warm-gray-900 mb-1">
              {hasSubmitted ? "Your Portfolio Vision" : "Tell me about your dream portfolio"}
            </h2>
            <p className="text-warm-gray-600">
              {hasSubmitted
                ? "You can update your responses anytime. I'll use this to design your portfolio."
                : "Help me understand what you're looking for so I can build your perfect portfolio."}
            </p>
          </div>
          {hasSubmitted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Submitted
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Portfolio Vision */}
        <div>
          <label
            htmlFor="portfolioVision"
            className="block text-sm font-medium text-warm-gray-900 mb-2"
          >
            What do you want your portfolio to look like? *
          </label>
          <textarea
            id="portfolioVision"
            value={portfolioVision}
            onChange={(e) => setPortfolioVision(e.target.value)}
            placeholder={EXAMPLE_VISION}
            rows={5}
            className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
            required
            minLength={10}
            maxLength={2000}
          />
          <p className="mt-1.5 text-xs text-warm-gray-500">
            Describe your ideal layout, colors, vibe, or any specific features you'd love to have.
          </p>
        </div>

        {/* Inspiring Brands */}
        <div>
          <label
            htmlFor="inspiringBrands"
            className="block text-sm font-medium text-warm-gray-900 mb-2"
          >
            Brands that inspire you
          </label>
          <textarea
            id="inspiringBrands"
            value={inspiringBrands}
            onChange={(e) => setInspiringBrands(e.target.value)}
            placeholder="e.g., Glossier's minimalist aesthetic, Apple's clean product photography, Aesop's elegant typography..."
            rows={3}
            className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
            maxLength={1000}
          />
          <p className="mt-1.5 text-xs text-warm-gray-500">
            What brands have a look and feel that resonates with you?
          </p>
        </div>

        {/* Portfolio Examples */}
        <div>
          <label
            htmlFor="portfolioExamples"
            className="block text-sm font-medium text-warm-gray-900 mb-2"
          >
            Portfolios you admire
          </label>
          <textarea
            id="portfolioExamples"
            value={portfolioExamples}
            onChange={(e) => setPortfolioExamples(e.target.value)}
            placeholder="Share links to creator portfolios or websites you like. What specifically do you like about them?"
            rows={3}
            className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
            maxLength={1000}
          />
          <p className="mt-1.5 text-xs text-warm-gray-500">
            Links to portfolios or websites you'd like yours to resemble.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-[--radius-md]">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-[--radius-md] flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || portfolioVision.length < 10}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : hasSubmitted ? (
            "Update Responses"
          ) : (
            "Submit"
          )}
        </button>
      </form>

      {/* Calendly Link - Now secondary */}
      <div className="px-6 pb-6 pt-2">
        <div className="border-t border-warm-gray-100 pt-6">
          <div className="flex items-center gap-3 text-warm-gray-600">
            <Calendar className="w-5 h-5 text-warm-gray-400 flex-shrink-0" />
            <p className="text-sm">
              Want to chat about your portfolio?{" "}
              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline font-medium inline-flex items-center gap-1"
              >
                Schedule a quick call
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
