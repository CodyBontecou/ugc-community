"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Globe,
  Plus,
  X,
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  ChevronRight,
  Pencil,
} from "lucide-react";

const CALENDLY_URL = "https://calendly.com/cody-isolated/30min";

const EXAMPLE_VISION = `I want a clean, modern portfolio that showcases my lifestyle and beauty content. I'd love a grid layout for my videos with a soft, warm color palette. I want visitors to immediately see my best work and understand my style. A simple contact form would be great so brands can reach out easily.`;

// Social media platforms configuration
const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "@username" },
  { id: "tiktok", label: "TikTok", icon: null, placeholder: "@username" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "@channel or URL" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "@username" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "profile URL" },
  { id: "other", label: "Other", icon: Globe, placeholder: "handle or URL" },
] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];

interface SocialMediaHandle {
  platform: SocialPlatform;
  handle: string;
}

interface OnboardingSlidesProps {
  onSubmitSuccess?: () => void;
}

// URL validation helper
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

// Slide definitions
const SLIDES = [
  { id: "welcome", title: "Welcome", shortTitle: "Start" },
  { id: "subdomain", title: "Your Portfolio URL", shortTitle: "URL" },
  { id: "social", title: "Social Media", shortTitle: "Social" },
  { id: "vision", title: "Your Vision", shortTitle: "Vision" },
  { id: "brands", title: "Inspiring Brands", shortTitle: "Brands" },
  { id: "websites", title: "Website Inspiration", shortTitle: "Sites" },
  { id: "review", title: "Review & Submit", shortTitle: "Review" },
] as const;

type SlideId = (typeof SLIDES)[number]["id"];

// localStorage key for saving progress
const STORAGE_KEY = "onboarding-progress";

interface SavedProgress {
  currentSlide: number;
  visitedSlides: number[];
  subdomain: string;
  portfolioVision: string;
  socialMediaHandles: SocialMediaHandle[];
  inspirationUrls: string[];
  inspiringBrandsList: string[];
  savedAt: number;
}

// Helper to load progress from localStorage
function loadSavedProgress(): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved) as SavedProgress;
    // Expire after 7 days
    if (Date.now() - data.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Helper to save progress to localStorage
function saveProgress(data: Omit<SavedProgress, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // Ignore storage errors
  }
}

// Helper to clear saved progress
function clearSavedProgress() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Animation variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function OnboardingSlides({ onSubmitSuccess }: OnboardingSlidesProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Navigation state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(new Set([0]));

  // Form state
  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
    suggestions: string[];
  }>({ checking: false, available: null, error: null, suggestions: [] });
  const [portfolioVision, setPortfolioVision] = useState("");
  const [socialMediaHandles, setSocialMediaHandles] = useState<SocialMediaHandle[]>([
    { platform: "instagram", handle: "" },
  ]);
  const [inspirationUrls, setInspirationUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<{ [key: number]: string }>({});
  const [inspiringBrandsList, setInspiringBrandsList] = useState<string[]>([""]);

  // Check subdomain availability with debounce
  const checkSubdomainAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSubdomainStatus({ checking: false, available: null, error: null, suggestions: [] });
      return;
    }

    setSubdomainStatus((prev) => ({ ...prev, checking: true }));

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

  // Check if user has already submitted, and restore progress from localStorage
  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          const data = await response.json();
          setHasSubmitted(data.hasSubmitted);
          
          // If user has already submitted, load from server and go to review
          if (data.hasSubmitted) {
            // Clear any local progress since they've already submitted
            clearSavedProgress();
            
            if (data.subdomain) {
              setSubdomain(data.subdomain);
              setSubdomainStatus({ checking: false, available: true, error: null, suggestions: [] });
            }
            if (data.questionnaire) {
              setPortfolioVision(data.questionnaire.portfolioVision || "");

              if (data.questionnaire.socialMediaHandles?.length > 0) {
                setSocialMediaHandles(data.questionnaire.socialMediaHandles);
              }
              if (data.questionnaire.inspirationUrls?.length > 0) {
                setInspirationUrls(data.questionnaire.inspirationUrls);
              } else if (data.questionnaire.portfolioExamples) {
                const urls = data.questionnaire.portfolioExamples
                  .split(/[\n,]/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0);
                if (urls.length > 0) {
                  setInspirationUrls(urls);
                }
              }
              if (data.questionnaire.inspiringBrandsList?.length > 0) {
                setInspiringBrandsList(data.questionnaire.inspiringBrandsList);
              } else if (data.questionnaire.inspiringBrands) {
                const brands = data.questionnaire.inspiringBrands
                  .split(/[,\n]/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0);
                if (brands.length > 0) {
                  setInspiringBrandsList(brands);
                }
              }
            }
            
            setCurrentSlide(SLIDES.length - 1);
            setVisitedSlides(new Set(SLIDES.map((_, i) => i)));
          } else {
            // User hasn't submitted yet - check for saved local progress
            const savedProgress = loadSavedProgress();
            
            if (savedProgress) {
              // Restore from localStorage
              setCurrentSlide(savedProgress.currentSlide);
              setVisitedSlides(new Set(savedProgress.visitedSlides));
              setSubdomain(savedProgress.subdomain);
              setPortfolioVision(savedProgress.portfolioVision);
              setSocialMediaHandles(savedProgress.socialMediaHandles);
              setInspirationUrls(savedProgress.inspirationUrls);
              setInspiringBrandsList(savedProgress.inspiringBrandsList);
              
              // Re-validate subdomain if it was set
              if (savedProgress.subdomain.length >= 3) {
                checkSubdomainAvailability(savedProgress.subdomain);
              }
            } else if (data.subdomain) {
              // No local progress but user has a subdomain set on server
              setSubdomain(data.subdomain);
              setSubdomainStatus({ checking: false, available: true, error: null, suggestions: [] });
            }
          }
        }
      } catch (err) {
        console.error("Error checking onboarding status:", err);
        // On error, still try to load from localStorage
        const savedProgress = loadSavedProgress();
        if (savedProgress) {
          setCurrentSlide(savedProgress.currentSlide);
          setVisitedSlides(new Set(savedProgress.visitedSlides));
          setSubdomain(savedProgress.subdomain);
          setPortfolioVision(savedProgress.portfolioVision);
          setSocialMediaHandles(savedProgress.socialMediaHandles);
          setInspirationUrls(savedProgress.inspirationUrls);
          setInspiringBrandsList(savedProgress.inspiringBrandsList);
        }
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, [checkSubdomainAvailability]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (canAdvance) goToNextSlide();
      } else if (e.key === "ArrowLeft") {
        goToPrevSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Save progress to localStorage whenever form state changes
  useEffect(() => {
    // Don't save if still loading or if user has already submitted
    if (isLoading || hasSubmitted) return;
    
    // Don't save if we're on the welcome slide with no progress
    if (currentSlide === 0 && !subdomain && !portfolioVision) return;

    saveProgress({
      currentSlide,
      visitedSlides: Array.from(visitedSlides),
      subdomain,
      portfolioVision,
      socialMediaHandles,
      inspirationUrls,
      inspiringBrandsList,
    });
  }, [
    isLoading,
    hasSubmitted,
    currentSlide,
    visitedSlides,
    subdomain,
    portfolioVision,
    socialMediaHandles,
    inspirationUrls,
    inspiringBrandsList,
  ]);

  // Social media handle management
  const addSocialHandle = () => {
    setSocialMediaHandles([...socialMediaHandles, { platform: "instagram", handle: "" }]);
  };

  const removeSocialHandle = (index: number) => {
    if (socialMediaHandles.length > 1) {
      setSocialMediaHandles(socialMediaHandles.filter((_, i) => i !== index));
    }
  };

  const updateSocialHandle = (index: number, field: "platform" | "handle", value: string) => {
    const updated = [...socialMediaHandles];
    if (field === "platform") {
      updated[index] = { ...updated[index], platform: value as SocialPlatform };
    } else {
      updated[index] = { ...updated[index], handle: value };
    }
    setSocialMediaHandles(updated);
  };

  // URL management
  const addInspirationUrl = () => {
    setInspirationUrls([...inspirationUrls, ""]);
  };

  const removeInspirationUrl = (index: number) => {
    if (inspirationUrls.length > 1) {
      setInspirationUrls(inspirationUrls.filter((_, i) => i !== index));
      const newErrors = { ...urlErrors };
      delete newErrors[index];
      setUrlErrors(newErrors);
    }
  };

  const updateInspirationUrl = (index: number, value: string) => {
    const updated = [...inspirationUrls];
    updated[index] = value;
    setInspirationUrls(updated);

    const newErrors = { ...urlErrors };
    if (value && !isValidUrl(value)) {
      newErrors[index] = "Please enter a valid URL (e.g., https://example.com)";
    } else {
      delete newErrors[index];
    }
    setUrlErrors(newErrors);
  };

  // Inspiring brands management
  const addInspiringBrand = () => {
    setInspiringBrandsList([...inspiringBrandsList, ""]);
  };

  const removeInspiringBrand = (index: number) => {
    if (inspiringBrandsList.length > 1) {
      setInspiringBrandsList(inspiringBrandsList.filter((_, i) => i !== index));
    }
  };

  const updateInspiringBrand = (index: number, value: string) => {
    const updated = [...inspiringBrandsList];
    updated[index] = value;
    setInspiringBrandsList(updated);
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return <Globe className="w-4 h-4" />;
    if (platformId === "tiktok") return <TikTokIcon className="w-4 h-4" />;
    if (platform.icon) {
      const Icon = platform.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <Globe className="w-4 h-4" />;
  };

  // Validation per slide
  const slideValidation = useMemo(() => {
    const validSocialHandles = socialMediaHandles.filter((h) => h.handle.trim().length > 0);
    const validBrands = inspiringBrandsList.filter((brand) => brand.trim().length > 0);
    const validUrls = inspirationUrls.filter((url) => url.trim().length > 0 && isValidUrl(url));
    const hasUrlErrors = Object.keys(urlErrors).length > 0;

    return {
      welcome: true,
      subdomain: subdomain.length >= 3 && subdomainStatus.available === true && !subdomainStatus.checking,
      social: validSocialHandles.length > 0,
      vision: portfolioVision.length >= 10,
      brands: validBrands.length > 0,
      websites: validUrls.length > 0 && !hasUrlErrors,
      review: true,
    };
  }, [subdomain, subdomainStatus, socialMediaHandles, portfolioVision, inspiringBrandsList, inspirationUrls, urlErrors]);

  const canAdvance = slideValidation[SLIDES[currentSlide].id as SlideId];

  // Navigation functions
  const goToSlide = (index: number) => {
    if (index < 0 || index >= SLIDES.length) return;
    if (index > currentSlide && !canAdvance) return;

    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
    setVisitedSlides((prev) => new Set([...prev, index]));
    setError(null);
  };

  const goToNextSlide = () => {
    if (currentSlide < SLIDES.length - 1 && canAdvance) {
      goToSlide(currentSlide + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const validSocialHandles = socialMediaHandles.filter((h) => h.handle.trim().length > 0);
    const validBrands = inspiringBrandsList.filter((brand) => brand.trim().length > 0);
    const validUrls = inspirationUrls.filter((url) => url.trim().length > 0 && isValidUrl(url));

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          portfolioVision,
          socialMediaHandles: validSocialHandles,
          inspirationUrls: validUrls,
          inspiringBrandsList: validBrands,
          portfolioExamples: validUrls.join("\n"),
          inspiringBrands: validBrands.join(", "),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit");
        if (data.suggestions) {
          setSubdomainStatus((prev) => ({
            ...prev,
            available: false,
            suggestions: data.suggestions,
          }));
        }
        return;
      }

      setHasSubmitted(true);
      setSuccessMessage(hasSubmitted ? "Updated!" : "Submitted - your portfolio is being generated!");
      
      // Clear saved progress on successful submission
      clearSavedProgress();
      
      onSubmitSuccess?.();

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 p-6 min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  // Render slide content
  const renderSlideContent = () => {
    switch (SLIDES[currentSlide].id) {
      case "welcome":
        return <WelcomeSlide hasSubmitted={hasSubmitted} />;
      case "subdomain":
        return (
          <SubdomainSlide
            subdomain={subdomain}
            setSubdomain={setSubdomain}
            subdomainStatus={subdomainStatus}
          />
        );
      case "social":
        return (
          <SocialSlide
            socialMediaHandles={socialMediaHandles}
            addSocialHandle={addSocialHandle}
            removeSocialHandle={removeSocialHandle}
            updateSocialHandle={updateSocialHandle}
            getPlatformIcon={getPlatformIcon}
          />
        );
      case "vision":
        return (
          <VisionSlide
            portfolioVision={portfolioVision}
            setPortfolioVision={setPortfolioVision}
          />
        );
      case "brands":
        return (
          <BrandsSlide
            inspiringBrandsList={inspiringBrandsList}
            addInspiringBrand={addInspiringBrand}
            removeInspiringBrand={removeInspiringBrand}
            updateInspiringBrand={updateInspiringBrand}
          />
        );
      case "websites":
        return (
          <WebsitesSlide
            inspirationUrls={inspirationUrls}
            urlErrors={urlErrors}
            addInspirationUrl={addInspirationUrl}
            removeInspirationUrl={removeInspirationUrl}
            updateInspirationUrl={updateInspirationUrl}
          />
        );
      case "review":
        return (
          <ReviewSlide
            subdomain={subdomain}
            socialMediaHandles={socialMediaHandles}
            portfolioVision={portfolioVision}
            inspiringBrandsList={inspiringBrandsList}
            inspirationUrls={inspirationUrls}
            goToSlide={goToSlide}
            hasSubmitted={hasSubmitted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-[--radius-xl] border border-warm-gray-200 overflow-hidden">
      {/* Progress indicator */}
      <div className="bg-gradient-to-br from-coral/5 via-rose/5 to-violet/5 px-6 py-4 border-b border-warm-gray-100">
        <div className="flex items-center justify-between gap-2">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => {
                if (visitedSlides.has(index) || index <= currentSlide) {
                  goToSlide(index);
                }
              }}
              disabled={!visitedSlides.has(index) && index > currentSlide}
              className={`flex-1 group relative ${
                !visitedSlides.has(index) && index > currentSlide
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Step indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index === currentSlide
                      ? "bg-gradient-to-br from-coral to-rose text-white scale-110 shadow-lg shadow-coral/30"
                      : visitedSlides.has(index)
                      ? "bg-green-100 text-green-600"
                      : "bg-warm-gray-100 text-warm-gray-400"
                  }`}
                >
                  {visitedSlides.has(index) && index !== currentSlide ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Label (hidden on mobile) */}
                <span
                  className={`text-xs font-medium hidden sm:block transition-colors ${
                    index === currentSlide
                      ? "text-coral"
                      : visitedSlides.has(index)
                      ? "text-warm-gray-600"
                      : "text-warm-gray-400"
                  }`}
                >
                  {slide.shortTitle}
                </span>
              </div>
              {/* Progress line */}
              {index < SLIDES.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 transition-colors ${
                    visitedSlides.has(index + 1)
                      ? "bg-gradient-to-r from-green-200 to-green-200"
                      : index < currentSlide
                      ? "bg-gradient-to-r from-coral/30 to-rose/30"
                      : "bg-warm-gray-200"
                  }`}
                  style={{ marginLeft: "50%" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Slide content */}
      <div className="relative min-h-[450px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="p-6 sm:p-8"
          >
            {renderSlideContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error/Success Messages */}
      {(error || successMessage) && (
        <div className="px-6 pb-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-[--radius-md]">{error}</p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-[--radius-md] flex items-center gap-2">
              <Check className="w-4 h-4" />
              {successMessage}
            </p>
          )}
        </div>
      )}

      {/* Navigation footer */}
      <div className="px-6 py-4 border-t border-warm-gray-100 bg-warm-gray-50/50">
        <div className="flex items-center justify-between gap-4">
          {/* Back button */}
          <button
            onClick={goToPrevSlide}
            disabled={currentSlide === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              currentSlide === 0
                ? "text-warm-gray-300 cursor-not-allowed"
                : "text-warm-gray-600 hover:text-warm-gray-900 hover:bg-warm-gray-100"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Slide counter */}
          <span className="text-sm text-warm-gray-400">
            {currentSlide + 1} of {SLIDES.length}
          </span>

          {/* Next/Submit button */}
          {currentSlide === SLIDES.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-coral/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {hasSubmitted ? "Updating..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {hasSubmitted ? "Update" : "Generate Portfolio"}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goToNextSlide}
              disabled={!canAdvance}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all ${
                canAdvance
                  ? "bg-gradient-to-r from-coral to-rose text-white hover:opacity-90 shadow-lg shadow-coral/20"
                  : "bg-warm-gray-100 text-warm-gray-400 cursor-not-allowed"
              }`}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Calendly Link */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 text-warm-gray-500">
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
  );
}

// ============================================
// Individual Slide Components
// ============================================

function WelcomeSlide({ hasSubmitted }: { hasSubmitted: boolean }) {
  return (
    <div className="text-center max-w-lg mx-auto py-8">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-coral to-rose flex items-center justify-center"
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl sm:text-4xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-4"
      >
        {hasSubmitted ? "Update Your Portfolio" : "Let's Build Your Portfolio"}
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-lg text-warm-gray-600 mb-8"
      >
        {hasSubmitted
          ? "Review and update your portfolio preferences. Any changes will regenerate your portfolio."
          : "Answer a few quick questions and I'll design a beautiful, personalized portfolio just for you."}
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-3 text-sm text-warm-gray-500"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-gray-100">
          <Check className="w-4 h-4 text-green-500" />
          Takes ~2 minutes
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-gray-100">
          <Check className="w-4 h-4 text-green-500" />
          AI-powered design
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warm-gray-100">
          <Check className="w-4 h-4 text-green-500" />
          Free to use
        </span>
      </motion.div>
    </div>
  );
}

interface SubdomainSlideProps {
  subdomain: string;
  setSubdomain: (value: string) => void;
  subdomainStatus: {
    checking: boolean;
    available: boolean | null;
    error: string | null;
    suggestions: string[];
  };
}

function SubdomainSlide({ subdomain, setSubdomain, subdomainStatus }: SubdomainSlideProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet/20 to-lavender/20 flex items-center justify-center">
          <Globe className="w-7 h-7 text-violet" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Choose your URL
        </h2>
        <p className="text-warm-gray-600">
          Pick a unique address for your portfolio
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="yourname"
              autoFocus
              className={`w-full px-4 py-4 text-lg rounded-[--radius-lg] border outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 ${
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
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-warm-gray-400" />
              </div>
            )}
            {!subdomainStatus.checking && subdomainStatus.available === true && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
            )}
            {!subdomainStatus.checking && subdomainStatus.available === false && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          <span className="text-warm-gray-500 font-medium whitespace-nowrap">.ugc.community</span>
        </div>

        {subdomainStatus.available === true && subdomain.length >= 3 && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-4 py-3 rounded-[--radius-md]"
          >
            <Check className="w-4 h-4" />
            Perfect! Your portfolio will be at <strong>{subdomain}.ugc.community</strong>
          </motion.p>
        )}

        {subdomainStatus.available === false && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-red-600 flex items-center gap-2 bg-red-50 px-4 py-3 rounded-[--radius-md]">
              <AlertCircle className="w-4 h-4" />
              {subdomainStatus.error}
            </p>
            {subdomainStatus.suggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-warm-gray-500 mb-2">Try one of these:</p>
                <div className="flex flex-wrap gap-2">
                  {subdomainStatus.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setSubdomain(suggestion)}
                      className="text-sm px-3 py-1.5 rounded-full bg-warm-gray-100 text-warm-gray-700 hover:bg-coral/10 hover:text-coral transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {subdomain.length > 0 && subdomain.length < 3 && (
          <p className="text-sm text-warm-gray-500">At least 3 characters needed</p>
        )}
      </div>
    </div>
  );
}

interface SocialSlideProps {
  socialMediaHandles: SocialMediaHandle[];
  addSocialHandle: () => void;
  removeSocialHandle: (index: number) => void;
  updateSocialHandle: (index: number, field: "platform" | "handle", value: string) => void;
  getPlatformIcon: (platformId: string) => React.ReactNode;
}

function SocialSlide({
  socialMediaHandles,
  addSocialHandle,
  removeSocialHandle,
  updateSocialHandle,
  getPlatformIcon,
}: SocialSlideProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose/20 to-coral/20 flex items-center justify-center">
          <Instagram className="w-7 h-7 text-rose" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Your social profiles
        </h2>
        <p className="text-warm-gray-600">
          Add at least one profile to display on your portfolio
        </p>
      </div>

      <div className="space-y-3">
        {socialMediaHandles.map((handle, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <select
                value={handle.platform}
                onChange={(e) => updateSocialHandle(index, "platform", e.target.value)}
                className="appearance-none pl-10 pr-8 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 bg-white text-sm min-w-[140px]"
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-warm-gray-500">
                {getPlatformIcon(handle.platform)}
              </div>
            </div>

            <input
              type="text"
              value={handle.handle}
              onChange={(e) => updateSocialHandle(index, "handle", e.target.value)}
              placeholder={SOCIAL_PLATFORMS.find((p) => p.id === handle.platform)?.placeholder || "@username"}
              autoFocus={index === 0}
              className="flex-1 px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
            />

            <button
              type="button"
              onClick={() => removeSocialHandle(index)}
              disabled={socialMediaHandles.length === 1}
              className={`p-2.5 rounded-[--radius-md] transition-colors ${
                socialMediaHandles.length === 1
                  ? "text-warm-gray-300 cursor-not-allowed"
                  : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSocialHandle}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[--radius-lg] border-2 border-dashed border-warm-gray-200 text-warm-gray-500 hover:border-coral hover:text-coral transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add another profile
      </button>
    </div>
  );
}

interface VisionSlideProps {
  portfolioVision: string;
  setPortfolioVision: (value: string) => void;
}

function VisionSlide({ portfolioVision, setPortfolioVision }: VisionSlideProps) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-lavender/20 to-purple-dark/20 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-lavender" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Describe your vision
        </h2>
        <p className="text-warm-gray-600">
          Tell me about your ideal portfolio—layout, colors, vibe, anything!
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={portfolioVision}
          onChange={(e) => setPortfolioVision(e.target.value)}
          placeholder={EXAMPLE_VISION}
          autoFocus
          rows={7}
          className="w-full px-4 py-4 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
          required
          minLength={10}
          maxLength={2000}
        />
        <div className="flex justify-between text-xs text-warm-gray-400">
          <span>Be as detailed as you'd like</span>
          <span>{portfolioVision.length}/2000</span>
        </div>
      </div>
    </div>
  );
}

interface BrandsSlideProps {
  inspiringBrandsList: string[];
  addInspiringBrand: () => void;
  removeInspiringBrand: (index: number) => void;
  updateInspiringBrand: (index: number, value: string) => void;
}

function BrandsSlide({
  inspiringBrandsList,
  addInspiringBrand,
  removeInspiringBrand,
  updateInspiringBrand,
}: BrandsSlideProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-mint/30 to-sky/30 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Brands you love
        </h2>
        <p className="text-warm-gray-600">
          What brands inspire your aesthetic or style?
        </p>
      </div>

      <div className="space-y-3">
        {inspiringBrandsList.map((brand, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={brand}
              onChange={(e) => updateInspiringBrand(index, e.target.value)}
              placeholder="e.g., Glossier, Apple, Nike"
              autoFocus={index === 0}
              className="flex-1 px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
              maxLength={200}
            />
            <button
              type="button"
              onClick={() => removeInspiringBrand(index)}
              disabled={inspiringBrandsList.length === 1}
              className={`p-2.5 rounded-[--radius-md] transition-colors ${
                inspiringBrandsList.length === 1
                  ? "text-warm-gray-300 cursor-not-allowed"
                  : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={addInspiringBrand}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[--radius-lg] border-2 border-dashed border-warm-gray-200 text-warm-gray-500 hover:border-coral hover:text-coral transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add another brand
      </button>
    </div>
  );
}

interface WebsitesSlideProps {
  inspirationUrls: string[];
  urlErrors: { [key: number]: string };
  addInspirationUrl: () => void;
  removeInspirationUrl: (index: number) => void;
  updateInspirationUrl: (index: number, value: string) => void;
}

function WebsitesSlide({
  inspirationUrls,
  urlErrors,
  addInspirationUrl,
  removeInspirationUrl,
  updateInspirationUrl,
}: WebsitesSlideProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-coral/20 to-rose/20 flex items-center justify-center">
          <Globe className="w-7 h-7 text-coral" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          Website inspiration
        </h2>
        <p className="text-warm-gray-600">
          Share portfolios or websites you'd like yours to resemble
        </p>
      </div>

      <div className="space-y-3">
        {inspirationUrls.map((url, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-warm-gray-400" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateInspirationUrl(index, e.target.value)}
                  placeholder="https://example.com"
                  autoFocus={index === 0}
                  className={`w-full pl-11 pr-4 py-3 rounded-[--radius-lg] border outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 ${
                    urlErrors[index]
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20"
                  }`}
                />
                {url && !urlErrors[index] && isValidUrl(url) && (
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeInspirationUrl(index)}
                disabled={inspirationUrls.length === 1}
                className={`p-2.5 rounded-[--radius-md] transition-colors ${
                  inspirationUrls.length === 1
                    ? "text-warm-gray-300 cursor-not-allowed"
                    : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {urlErrors[index] && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1 pl-1">
                <AlertCircle className="w-3 h-3" />
                {urlErrors[index]}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={addInspirationUrl}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[--radius-lg] border-2 border-dashed border-warm-gray-200 text-warm-gray-500 hover:border-coral hover:text-coral transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add another website
      </button>
    </div>
  );
}

interface ReviewSlideProps {
  subdomain: string;
  socialMediaHandles: SocialMediaHandle[];
  portfolioVision: string;
  inspiringBrandsList: string[];
  inspirationUrls: string[];
  goToSlide: (index: number) => void;
  hasSubmitted: boolean;
}

function ReviewSlide({
  subdomain,
  socialMediaHandles,
  portfolioVision,
  inspiringBrandsList,
  inspirationUrls,
  goToSlide,
  hasSubmitted,
}: ReviewSlideProps) {
  const validSocials = socialMediaHandles.filter((h) => h.handle.trim());
  const validBrands = inspiringBrandsList.filter((b) => b.trim());
  const validUrls = inspirationUrls.filter((u) => u.trim() && isValidUrl(u));

  const ReviewItem = ({
    label,
    slideIndex,
    children,
  }: {
    label: string;
    slideIndex: number;
    children: React.ReactNode;
  }) => (
    <div className="p-4 rounded-[--radius-lg] bg-warm-gray-50 border border-warm-gray-100 group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide">{label}</span>
        <button
          onClick={() => goToSlide(slideIndex)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-coral hover:text-coral/80 inline-flex items-center gap-1 text-xs font-medium"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div className="text-warm-gray-900">{children}</div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-100 to-mint/30 flex items-center justify-center">
          <Check className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-display)] text-warm-gray-900 mb-2">
          {hasSubmitted ? "Review your updates" : "Review your answers"}
        </h2>
        <p className="text-warm-gray-600">
          Make sure everything looks good before we generate your portfolio
        </p>
      </div>

      <div className="space-y-3">
        <ReviewItem label="Portfolio URL" slideIndex={1}>
          <span className="font-medium">{subdomain}.ugc.community</span>
        </ReviewItem>

        <ReviewItem label="Social Profiles" slideIndex={2}>
          <div className="flex flex-wrap gap-2">
            {validSocials.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-warm-gray-200 text-sm"
              >
                {SOCIAL_PLATFORMS.find((p) => p.id === h.platform)?.label}: {h.handle}
              </span>
            ))}
          </div>
        </ReviewItem>

        <ReviewItem label="Your Vision" slideIndex={3}>
          <p className="text-sm line-clamp-3">{portfolioVision}</p>
        </ReviewItem>

        <ReviewItem label="Inspiring Brands" slideIndex={4}>
          <div className="flex flex-wrap gap-2">
            {validBrands.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-warm-gray-200 text-sm"
              >
                {b}
              </span>
            ))}
          </div>
        </ReviewItem>

        <ReviewItem label="Website Inspiration" slideIndex={5}>
          <div className="space-y-1">
            {validUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-coral hover:underline flex items-center gap-1"
              >
                {new URL(url).hostname}
                <ChevronRight className="w-3 h-3" />
              </a>
            ))}
          </div>
        </ReviewItem>
      </div>
    </div>
  );
}
