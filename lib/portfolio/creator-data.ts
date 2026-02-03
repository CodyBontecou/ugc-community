import type {
  SocialMediaHandle,
  BrandPartnership,
  VideoEntry,
  ImageEntry,
} from "@/lib/db/schema";

export interface SocialHandle {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "other";
  handle: string;
  url?: string;
  followerCount?: number;
}

export interface BrandPartner {
  name: string;
  type: "paid" | "gifted" | "ambassador" | "affiliate" | "collaboration";
}

export interface Video {
  url: string;
  title: string;
  platform: "tiktok" | "instagram" | "youtube";
  thumbnailUrl?: string;
  views?: string;
  featured?: boolean;
}

export interface PortfolioImage {
  url: string;
  alt: string;
  title: string;
  category: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
}

export const AVAILABLE_SERVICES: Service[] = [
  {
    id: "ugc-videos",
    title: "UGC Video Creation",
    description:
      "High-quality, authentic video content created specifically for your brand. Includes product demonstrations, unboxings, testimonials, and lifestyle content optimized for your marketing channels.",
    deliverables: [
      "Raw footage",
      "Edited versions",
      "Multiple formats (9:16, 1:1, 16:9)",
      "Usage rights",
    ],
  },
  {
    id: "ugc-photos",
    title: "UGC Photo Content",
    description:
      "Professional product photography and lifestyle images that feel authentic and relatable. Perfect for ads, social media, and e-commerce.",
    deliverables: ["High-res images", "Multiple angles", "Lifestyle shots", "Product flatlays"],
  },
  {
    id: "sponsored-posts",
    title: "Sponsored Posts",
    description:
      "Integrated content on my platforms featuring your products. Each post includes authentic storytelling tailored to resonate with my engaged community.",
    deliverables: ["Feed posts", "Stories", "Reels/TikToks", "Performance analytics"],
  },
  {
    id: "product-reviews",
    title: "Product Reviews",
    description:
      "Honest, in-depth product reviews that my audience trusts. Detailed breakdowns, real results, and authentic recommendations.",
    deliverables: ["Video review", "Written companion", "Before/after documentation"],
  },
  {
    id: "brand-ambassador",
    title: "Brand Ambassador",
    description:
      "Long-term partnership for ongoing content creation, product launches, and exclusive collaborations. Build lasting brand awareness with consistent presence.",
    deliverables: ["Monthly content", "Exclusivity options", "Event attendance", "Product feedback"],
  },
  {
    id: "whitelisting",
    title: "Ad Whitelisting",
    description:
      "Allow your brand to run ads through my social media accounts. Leverage my authentic voice and audience trust for your paid campaigns.",
    deliverables: ["Account access for ads", "Content approval workflow", "Performance tracking"],
  },
  {
    id: "live-streaming",
    title: "Live Streaming",
    description:
      "Real-time product demonstrations and Q&A sessions. Engage directly with potential customers through authentic, unscripted content.",
    deliverables: ["Live stream session", "Replay content", "Audience engagement"],
  },
  {
    id: "tutorials",
    title: "Tutorials & How-To Content",
    description:
      "Educational content showing how to use your products effectively. Step-by-step guides that provide value while showcasing your brand.",
    deliverables: ["Tutorial videos", "Written guides", "Tips & tricks content"],
  },
  {
    id: "unboxing",
    title: "Unboxing & First Impressions",
    description:
      "Authentic first-look content capturing genuine reactions to your products. Perfect for launches and generating excitement.",
    deliverables: ["Unboxing video", "First impressions", "Initial review"],
  },
  {
    id: "testimonials",
    title: "Testimonials & Talking Head",
    description:
      "Direct-to-camera testimonials sharing my genuine experience with your product. Builds trust through authentic personal stories.",
    deliverables: ["Testimonial video", "Multiple takes", "B-roll footage"],
  },
  {
    id: "voiceover",
    title: "Voiceover Content",
    description:
      "Professional voiceover for your existing footage or new content. Add authentic narration to your brand's visual content.",
    deliverables: ["Voiceover recording", "Script collaboration", "Multiple takes"],
  },
  {
    id: "event-coverage",
    title: "Event Coverage",
    description:
      "On-location content creation at your events, launches, or activations. Capture the energy and excitement in real-time.",
    deliverables: ["Event content", "Behind-the-scenes", "Live posting", "Recap content"],
  },
];

export const PARTNERSHIP_TYPES = [
  { id: "paid", label: "Paid Partnership" },
  { id: "gifted", label: "Gifted" },
  { id: "ambassador", label: "Brand Ambassador" },
  { id: "affiliate", label: "Affiliate" },
  { id: "collaboration", label: "Collaboration" },
] as const;

export const NICHE_OPTIONS = [
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

export type Niche = (typeof NICHE_OPTIONS)[number];

export interface CreatorData {
  name: string;
  email: string;
  niche: Niche;
  tagline?: string;
  bio: string;
  location?: string;
  socialHandles: SocialHandle[];
  brandPartnerships: BrandPartner[];
  videos: Video[];
  images: PortfolioImage[];
  selectedServices: string[];
  inspirationUrls?: string[];
  portfolioVision?: string;
}

export interface QuestionnaireData {
  name: string | null;
  email: string | null;
  niche: string | null;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  socialMediaHandles: SocialMediaHandle[] | null;
  brandPartnerships: BrandPartnership[] | null;
  videos: VideoEntry[] | null;
  images: ImageEntry[] | null;
  selectedServices: string[] | null;
}

export interface CreatorFallbacks {
  name?: string | null;
  email?: string | null;
}

export function getSelectedServices(selectedIds: string[]): Service[] {
  return AVAILABLE_SERVICES.filter((service) => selectedIds.includes(service.id));
}

export function getSocialUrl(handle: SocialHandle): string {
  if (handle.url) return handle.url;

  const cleanHandle = handle.handle.replace("@", "");

  switch (handle.platform) {
    case "instagram":
      return `https://instagram.com/${cleanHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${cleanHandle}`;
    case "youtube":
      return cleanHandle.startsWith("http") ? cleanHandle : `https://youtube.com/@${cleanHandle}`;
    case "twitter":
      return `https://twitter.com/${cleanHandle}`;
    case "linkedin":
      return cleanHandle.startsWith("http")
        ? cleanHandle
        : `https://linkedin.com/in/${cleanHandle}`;
    default:
      return cleanHandle.startsWith("http") ? cleanHandle : "#";
  }
}

export function buildCreatorData(
  questionnaire: QuestionnaireData,
  fallbacks: CreatorFallbacks = {}
): CreatorData {
  const socialHandles = (questionnaire.socialMediaHandles || [])
    .filter((handle) => handle.handle.trim().length > 0)
    .map((handle) => {
      const trimmed = handle.handle.trim();
      return {
        platform: handle.platform,
        handle: trimmed,
        url: trimmed.startsWith("http") ? trimmed : undefined,
      };
    });

  const videos = (questionnaire.videos || [])
    .filter((video) => video.url.trim().length > 0)
    .map((video) => ({
      url: video.url,
      title: video.title,
      platform: video.platform,
    }));

  const images = (questionnaire.images || [])
    .filter((image) => image.url.trim().length > 0)
    .map((image) => ({
      url: image.url,
      alt: image.title || "Portfolio image",
      title: image.title || "",
      category: image.category || "",
    }));

  return {
    name: questionnaire.name || fallbacks.name || "Creator",
    email: questionnaire.email || fallbacks.email || "",
    niche: (questionnaire.niche as Niche) || "Lifestyle",
    tagline: questionnaire.tagline || undefined,
    bio: questionnaire.bio || "",
    location: questionnaire.location || undefined,
    socialHandles,
    brandPartnerships: (questionnaire.brandPartnerships || []) as BrandPartner[],
    videos,
    images,
    selectedServices: questionnaire.selectedServices || [],
  };
}
