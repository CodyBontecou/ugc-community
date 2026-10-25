"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, ArrowRight, Check, Loader2, Sparkles, AlertCircle, Globe } from "lucide-react";

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

  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
    suggestions: string[];
  }>({ checking: false, available: null, error: null, suggestions: [] });
  const [portfolioVision, setPortfolioVision] = useState("");
  const [inspiringBrands, setInspiringBrands] = useState("");
  const [portfolioExamples, setPortfolioExamples] = useState("");

  // Check subdomain availability with debounce
  const checkSubdomainAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSubdomainStatus({ checking: false, available: null, error: null, suggestions: [] });
      return;
    }

    setSubdomainStatus(prev => ({ ...prev, checking: true }));

    try {
      const response = await fetch(`/api/user/subdomain?check=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (data.available) {
        setSubdomainStatus({
          checking: false,
          available: true,
          error: null,
          suggestions: [],
        });
      } else {
        setSubdomainStatus({
          checking: false,
          available: false,
          error: data.reason || "Not available",
          suggestions: data.suggestions || [],
        });
      }
    } catch {
      setSubdomainStatus({
        checking: false,
        available: null,
        error: "Failed to check availability",
        suggestions: [],
      });
    }
  }, []);

  // Debounce subdomain check
  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: null, error: null, suggestions: [] });
      return;
    }

    const timer = setTimeout(() => {
      checkSubdomainAvailability(subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [subdomain, checkSubdomainAvailability]);

  // Check if user has already submitted
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          const data = await response.json();
          setHasSubmitted(data.hasSubmitted);
          if (data.subdomain) {
            setSubdomain(data.subdomain);
            setSubdomainStatus({ checking: false, available: true, error: null, suggestions: [] });
          }
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

    // Validate subdomain before submitting
    if (!subdomain || subdomain.length < 3) {
      setError("Please enter a subdomain (at least 3 characters)");
      return;
    }

    if (subdomainStatus.available === false) {
      setError("Please choose an available subdomain");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          portfolioVision,
          inspiringBrands,
          portfolioExamples,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit");
        if (data.suggestions) {
          setSubdomainStatus(prev => ({
            ...prev,
            available: false,
            suggestions: data.suggestions,
          }));
        }
        return;
      }

      setHasSubmitted(true);
      setSuccessMessage(hasSubmitted ? "Updated!" : "Submitted - your portfolio is being generated!");
      onSubmitSuccess?.();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-warm-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-warm-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-coral/10 via-rose/10 to-violet/10 p-5 sm:p-6 border-b border-coral/10">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
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
            <span className="sm:ml-auto inline-flex shrink-0 items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Submitted
            </span>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
        {/* Subdomain */}
        <div>
          <label
            htmlFor="subdomain"
            className="block text-sm font-medium text-warm-gray-900 mb-2"
          >
            Choose your portfolio URL *
          </label>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-warm-gray-400" />
              </div>
              <input
                id="subdomain"
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="yourname"
                className={`min-w-0 w-full text-base pl-10 pr-10 py-3 rounded-[var(--radius-lg)] border outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 ${
                  subdomainStatus.available === true
                    ? "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    : subdomainStatus.available === false
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20"
                }`}
                required
                minLength={3}
                maxLength={63}
              />
              {subdomainStatus.checking && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-warm-gray-400" />
                </div>
              )}
              {!subdomainStatus.checking && subdomainStatus.available === true && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {!subdomainStatus.checking && subdomainStatus.available === false && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            <span className="self-end text-warm-gray-500 text-sm whitespace-nowrap sm:self-auto">.ugc.community</span>
          </div>
          {subdomainStatus.available === true && subdomain.length >= 3 && (
            <p className="mt-1.5 break-words text-xs text-green-600">
              <Check className="w-3 h-3" />
              Available! Your portfolio will be at {subdomain}.ugc.community
            </p>
          )}
          {subdomainStatus.available === false && (
            <div className="mt-1.5">
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {subdomainStatus.error}
              </p>
              {subdomainStatus.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-warm-gray-500 mb-1">Try one of these instead:</p>
                  <div className="flex flex-wrap gap-2">
                    {subdomainStatus.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setSubdomain(suggestion)}
                        className="text-xs px-2 py-1 rounded-full bg-warm-gray-100 text-warm-gray-700 hover:bg-coral/10 hover:text-coral transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {subdomain.length > 0 && subdomain.length < 3 && (
            <p className="mt-1.5 text-xs text-warm-gray-500">
              Subdomain must be at least 3 characters
            </p>
          )}
        </div>

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
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
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
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
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
            className="w-full px-4 py-3 rounded-[var(--radius-lg)] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
            maxLength={1000}
          />
          <p className="mt-1.5 text-xs text-warm-gray-500">
            Links to portfolios or websites you'd like yours to resemble.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-[var(--radius-md)]">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-[var(--radius-md)] flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            portfolioVision.length < 10 ||
            subdomain.length < 3 ||
            subdomainStatus.available === false ||
            subdomainStatus.checking
          }
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {hasSubmitted ? "Updating..." : "Creating your portfolio..."}
            </>
          ) : hasSubmitted ? (
            "Update Responses"
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate My Portfolio
            </>
          )}
        </button>
      </form>

      {/* Calendly Link - Now secondary */}
      <div className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6">
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
