"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  ArrowRight,
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
  Video,
  Image as ImageIcon,
  Building2,
  User,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";

const CALENDLY_URL = "https://calendly.com/cody-isolated/30min";

// Social media platforms configuration
const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, placeholder: "@username" },
  { id: "tiktok", label: "TikTok", icon: null, placeholder: "@username" },
  { id: "youtube", label: "YouTube", icon: Youtube, placeholder: "@channel or URL" },
  { id: "twitter", label: "X / Twitter", icon: Twitter, placeholder: "@username" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, placeholder: "profile URL" },
  { id: "other", label: "Other", icon: Globe, placeholder: "handle or URL" },
] as const;

// Niche options
const NICHE_OPTIONS = [
  "Beauty & Skincare",
  "Fashion & Style",
  "Lifestyle",
  "Fitness & Wellness",
  "Food & Cooking",
  "Travel",
  "Tech & Gaming",
  "Home & Decor",
  "Parenting & Family",
  "Pets & Animals",
  "Finance & Business",
  "Health & Medical",
  "Entertainment",
  "Education",
  "DIY & Crafts",
  "Automotive",
  "Sports & Outdoors",
  "Music",
  "Art & Design",
  "Other",
] as const;

// Partnership types
const PARTNERSHIP_TYPES = [
  { id: "paid", label: "Paid Partnership" },
  { id: "gifted", label: "Gifted" },
  { id: "ambassador", label: "Brand Ambassador" },
  { id: "affiliate", label: "Affiliate" },
  { id: "collaboration", label: "Collaboration" },
] as const;

// Available services
const AVAILABLE_SERVICES = [
  { id: "ugc-videos", title: "UGC Video Creation", description: "Video content for brand marketing" },
  { id: "ugc-photos", title: "UGC Photo Content", description: "Product photography and lifestyle images" },
  { id: "sponsored-posts", title: "Sponsored Posts", description: "Integrated content on my platforms" },
  { id: "product-reviews", title: "Product Reviews", description: "Honest, in-depth product reviews" },
  { id: "brand-ambassador", title: "Brand Ambassador", description: "Long-term partnership opportunities" },
  { id: "whitelisting", title: "Ad Whitelisting", description: "Run ads through my social accounts" },
  { id: "live-streaming", title: "Live Streaming", description: "Real-time product demonstrations" },
  { id: "tutorials", title: "Tutorials & How-To", description: "Educational content showing product use" },
  { id: "unboxing", title: "Unboxing & First Impressions", description: "Authentic first-look content" },
  { id: "testimonials", title: "Testimonials", description: "Direct-to-camera testimonials" },
  { id: "voiceover", title: "Voiceover Content", description: "Professional voiceover for content" },
  { id: "event-coverage", title: "Event Coverage", description: "On-location content creation" },
] as const;

// Video platforms
const VIDEO_PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram Reels" },
  { id: "youtube", label: "YouTube" },
] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];
type Niche = (typeof NICHE_OPTIONS)[number];
type PartnershipType = (typeof PARTNERSHIP_TYPES)[number]["id"];
type VideoPlatform = (typeof VIDEO_PLATFORMS)[number]["id"];

interface SocialMediaHandle {
  platform: SocialPlatform;
  handle: string;
}

interface BrandPartnership {
  name: string;
  type: PartnershipType;
}

interface VideoEntry {
  url: string;
  title: string;
  platform: VideoPlatform;
}

interface ImageEntry {
  url: string;
  title: string;
  category: string;
}

interface OnboardingFormProps {
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

export function OnboardingForm({ onSubmitSuccess }: OnboardingFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Basic info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState<Niche>("Lifestyle");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");

  // Subdomain
  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    error: string | null;
    suggestions: string[];
  }>({ checking: false, available: null, error: null, suggestions: [] });

  // Social handles
  const [socialMediaHandles, setSocialMediaHandles] = useState<SocialMediaHandle[]>([
    { platform: "instagram", handle: "" },
  ]);

  // Brand partnerships
  const [brandPartnerships, setBrandPartnerships] = useState<BrandPartnership[]>([
    { name: "", type: "paid" },
  ]);

  // Videos
  const [videos, setVideos] = useState<VideoEntry[]>([
    { url: "", title: "", platform: "tiktok" },
  ]);

  // Images
  const [images, setImages] = useState<ImageEntry[]>([
    { url: "", title: "", category: "" },
  ]);

  // Services
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "ugc-videos",
    "sponsored-posts",
  ]);

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
            const q = data.questionnaire;
            // Load all fields
            if (q.name) setName(q.name);
            if (q.email) setEmail(q.email);
            if (q.niche) setNiche(q.niche);
            if (q.tagline) setTagline(q.tagline);
            if (q.bio) setBio(q.bio);
            if (q.location) setLocation(q.location);
            if (q.socialMediaHandles?.length > 0) setSocialMediaHandles(q.socialMediaHandles);
            if (q.brandPartnerships?.length > 0) setBrandPartnerships(q.brandPartnerships);
            if (q.videos?.length > 0) setVideos(q.videos);
            if (q.images?.length > 0) setImages(q.images);
            if (q.selectedServices?.length > 0) setSelectedServices(q.selectedServices);
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

  // Brand partnership management
  const addBrandPartnership = () => {
    setBrandPartnerships([...brandPartnerships, { name: "", type: "paid" }]);
  };

  const removeBrandPartnership = (index: number) => {
    if (brandPartnerships.length > 1) {
      setBrandPartnerships(brandPartnerships.filter((_, i) => i !== index));
    }
  };

  const updateBrandPartnership = (index: number, field: "name" | "type", value: string) => {
    const updated = [...brandPartnerships];
    if (field === "type") {
      updated[index] = { ...updated[index], type: value as PartnershipType };
    } else {
      updated[index] = { ...updated[index], name: value };
    }
    setBrandPartnerships(updated);
  };

  // Video management
  const addVideo = () => {
    setVideos([...videos, { url: "", title: "", platform: "tiktok" }]);
  };

  const removeVideo = (index: number) => {
    if (videos.length > 1) {
      setVideos(videos.filter((_, i) => i !== index));
    }
  };

  const updateVideo = (index: number, field: keyof VideoEntry, value: string) => {
    const updated = [...videos];
    updated[index] = { ...updated[index], [field]: value };
    setVideos(updated);
  };

  // Image management
  const addImage = () => {
    setImages([...images, { url: "", title: "", category: "" }]);
  };

  const removeImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  const updateImage = (index: number, field: keyof ImageEntry, value: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    setImages(updated);
  };

  // Service toggle
  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
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

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!name.trim()) return "Please enter your name";
        if (!email.trim()) return "Please enter your email";
        if (!bio.trim() || bio.length < 10) return "Please write a bio (at least 10 characters)";
        if (!subdomain || subdomain.length < 3) return "Please enter a subdomain (at least 3 characters)";
        if (subdomainStatus.available === false) return "Please choose an available subdomain";
        return null;
      case 2:
        const validSocialHandles = socialMediaHandles.filter((h) => h.handle.trim().length > 0);
        if (validSocialHandles.length === 0) return "Please add at least one social media handle";
        return null;
      case 3:
        // Brand partnerships are optional
        // Videos are optional
        return null;
      case 4:
        if (selectedServices.length === 0) return "Please select at least one service you offer";
        return null;
      default:
        return null;
    }
  };

  const nextStep = () => {
    const error = validateStep(currentStep);
    if (error) {
      setError(error);
      return;
    }
    setError(null);
    setCurrentStep(Math.min(currentStep + 1, totalSteps));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate all steps
    for (let step = 1; step <= totalSteps; step++) {
      const stepError = validateStep(step);
      if (stepError) {
        setCurrentStep(step);
        setError(stepError);
        return;
      }
    }

    setIsSubmitting(true);

    // Filter out empty entries
    const validSocialHandles = socialMediaHandles.filter((h) => h.handle.trim().length > 0);
    const validBrandPartnerships = brandPartnerships.filter((b) => b.name.trim().length > 0);
    const validVideos = videos.filter((v) => v.url.trim().length > 0 && v.title.trim().length > 0);
    const validImages = images.filter((i) => i.url.trim().length > 0);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain,
          name,
          email,
          niche,
          tagline,
          bio,
          location,
          socialMediaHandles: validSocialHandles,
          brandPartnerships: validBrandPartnerships,
          videos: validVideos,
          images: validImages,
          selectedServices,
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
              {hasSubmitted ? "Your Media Kit" : "Create Your Media Kit"}
            </h2>
            <p className="text-warm-gray-600">
              {hasSubmitted
                ? "Update your information anytime."
                : "Tell us about yourself to generate your professional media kit."}
            </p>
          </div>
          {hasSubmitted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4" />
              Submitted
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i + 1 <= currentStep ? "bg-coral" : "bg-warm-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-warm-gray-500">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Your Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Contact Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-warm-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
                  required
                />
              </div>
            </div>

            {/* Niche */}
            <div>
              <label htmlFor="niche" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Your Niche *
              </label>
              <select
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value as Niche)}
                className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 bg-white"
              >
                {NICHE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {/* Tagline */}
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Tagline (optional)
              </label>
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g., Skincare Creator • Beauty Enthusiast"
                className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-warm-gray-500">A short description that appears under your name</p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-warm-gray-900 mb-2">
                About You *
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell brands about yourself, your content style, and what makes you unique..."
                rows={4}
                className="w-full px-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all resize-none text-warm-gray-900 placeholder:text-warm-gray-400"
                required
                minLength={10}
                maxLength={1000}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Location (optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-warm-gray-400" />
                </div>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Los Angeles, CA"
                  className="w-full pl-10 pr-4 py-3 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400"
                />
              </div>
            </div>

            {/* Subdomain */}
            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-warm-gray-900 mb-2">
                Your Portfolio URL *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-warm-gray-400" />
                  </div>
                  <input
                    id="subdomain"
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="yourname"
                    className={`w-full pl-10 pr-4 py-3 rounded-[--radius-lg] border outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 ${
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
                <span className="text-warm-gray-500 text-sm whitespace-nowrap">.ugc.community</span>
              </div>
              {subdomainStatus.available === true && subdomain.length >= 3 && (
                <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
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
            </div>
          </div>
        )}

        {/* Step 2: Social Media */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Social Media Handles
            </h3>
            <p className="text-xs text-warm-gray-500">Add your social media profiles to display on your media kit</p>

            <div className="space-y-3">
              {socialMediaHandles.map((handle, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={handle.platform}
                      onChange={(e) => updateSocialHandle(index, "platform", e.target.value)}
                      className="appearance-none pl-9 pr-8 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 bg-white text-sm min-w-[140px]"
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
                    className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSocialHandle(index)}
                    disabled={socialMediaHandles.length === 1}
                    className={`p-2 rounded-[--radius-md] transition-colors ${
                      socialMediaHandles.length === 1
                        ? "text-warm-gray-300 cursor-not-allowed"
                        : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSocialHandle}
              className="inline-flex items-center gap-1.5 text-sm text-coral hover:text-coral/80 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another handle
            </button>
          </div>
        )}

        {/* Step 3: Portfolio Content */}
        {currentStep === 3 && (
          <div className="space-y-8">
            {/* Brand Partnerships */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Brand Partnerships (optional)
              </h3>
              <p className="text-xs text-warm-gray-500">Add brands you've worked with to showcase your experience</p>

              <div className="space-y-3">
                {brandPartnerships.map((partnership, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={partnership.name}
                      onChange={(e) => updateBrandPartnership(index, "name", e.target.value)}
                      placeholder="Brand name"
                      className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                    />
                    <select
                      value={partnership.type}
                      onChange={(e) => updateBrandPartnership(index, "type", e.target.value)}
                      className="px-3 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 bg-white text-sm"
                    >
                      {PARTNERSHIP_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeBrandPartnership(index)}
                      disabled={brandPartnerships.length === 1}
                      className={`p-2 rounded-[--radius-md] transition-colors ${
                        brandPartnerships.length === 1
                          ? "text-warm-gray-300 cursor-not-allowed"
                          : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBrandPartnership}
                className="inline-flex items-center gap-1.5 text-sm text-coral hover:text-coral/80 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another brand
              </button>
            </div>

            {/* Videos */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4" />
                Featured Videos (optional)
              </h3>
              <p className="text-xs text-warm-gray-500">Add links to your best-performing videos</p>

              <div className="space-y-3">
                {videos.map((video, index) => (
                  <div key={index} className="p-4 border border-warm-gray-200 rounded-[--radius-lg] space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={video.url}
                        onChange={(e) => updateVideo(index, "url", e.target.value)}
                        placeholder="https://tiktok.com/..."
                        className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        disabled={videos.length === 1}
                        className={`p-2 rounded-[--radius-md] transition-colors ${
                          videos.length === 1
                            ? "text-warm-gray-300 cursor-not-allowed"
                            : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => updateVideo(index, "title", e.target.value)}
                        placeholder="Video title"
                        className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                      />
                      <select
                        value={video.platform}
                        onChange={(e) => updateVideo(index, "platform", e.target.value)}
                        className="px-3 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 bg-white text-sm"
                      >
                        {VIDEO_PLATFORMS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addVideo}
                className="inline-flex items-center gap-1.5 text-sm text-coral hover:text-coral/80 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another video
              </button>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Featured Images (optional)
              </h3>
              <p className="text-xs text-warm-gray-500">Add links to your best product photos or content images</p>

              <div className="space-y-3">
                {images.map((image, index) => (
                  <div key={index} className="p-4 border border-warm-gray-200 rounded-[--radius-lg] space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={image.url}
                        onChange={(e) => updateImage(index, "url", e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={images.length === 1}
                        className={`p-2 rounded-[--radius-md] transition-colors ${
                          images.length === 1
                            ? "text-warm-gray-300 cursor-not-allowed"
                            : "text-warm-gray-400 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={image.title}
                        onChange={(e) => updateImage(index, "title", e.target.value)}
                        placeholder="Image title"
                        className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                      />
                      <input
                        type="text"
                        value={image.category}
                        onChange={(e) => updateImage(index, "category", e.target.value)}
                        placeholder="Category (e.g., Product Shot)"
                        className="flex-1 px-4 py-2.5 rounded-[--radius-lg] border border-warm-gray-200 focus:border-coral focus:ring-2 focus:ring-coral/20 outline-none transition-all text-warm-gray-900 placeholder:text-warm-gray-400 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-1.5 text-sm text-coral hover:text-coral/80 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another image
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Services */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-warm-gray-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Services You Offer
            </h3>
            <p className="text-xs text-warm-gray-500">Select the services you want to offer to brands</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {AVAILABLE_SERVICES.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`p-4 text-left border rounded-[--radius-lg] transition-all ${
                    selectedServices.includes(service.id)
                      ? "border-coral bg-coral/5 ring-1 ring-coral"
                      : "border-warm-gray-200 hover:border-warm-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                        selectedServices.includes(service.id)
                          ? "bg-coral border-coral text-white"
                          : "border-warm-gray-300"
                      }`}
                    >
                      {selectedServices.includes(service.id) && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-medium text-warm-gray-900 text-sm">{service.title}</p>
                      <p className="text-xs text-warm-gray-500 mt-0.5">{service.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <p className="mt-6 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-[--radius-md]">{error}</p>
        )}
        {successMessage && (
          <p className="mt-6 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-[--radius-md] flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              currentStep === 1
                ? "text-warm-gray-300 cursor-not-allowed"
                : "text-warm-gray-600 hover:text-warm-gray-900 hover:bg-warm-gray-100"
            }`}
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || subdomainStatus.checking}
              className="px-6 py-2.5 bg-gradient-to-r from-coral to-rose text-white font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {hasSubmitted ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {hasSubmitted ? "Update Media Kit" : "Generate My Media Kit"}
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Calendly Link */}
      <div className="px-6 pb-6">
        <div className="border-t border-warm-gray-100 pt-6">
          <div className="flex items-center gap-3 text-warm-gray-600">
            <Calendar className="w-5 h-5 text-warm-gray-400 flex-shrink-0" />
            <p className="text-sm">
              Have questions?{" "}
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
