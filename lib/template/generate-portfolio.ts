import * as fs from "fs/promises";
import * as path from "path";
import {
  OnboardingQuestionnaire,
  SocialMediaHandle,
  BrandPartnership,
  VideoEntry,
  ImageEntry,
} from "@/lib/db/schema";

// =====================================================
// Types
// =====================================================

export interface GeneratedFile {
  path: string;
  content: string;
  isBinary?: boolean;
}

export interface GenerationResult {
  files: GeneratedFile[];
  success: boolean;
  error?: string;
}

export interface PortfolioData {
  name: string;
  email: string;
  niche: string;
  tagline?: string;
  bio: string;
  location?: string;
  socialMediaHandles: SocialMediaHandle[];
  brandPartnerships: BrandPartnership[];
  videos: VideoEntry[];
  images: ImageEntry[];
  selectedServices: string[];
}

// =====================================================
// Template Path Configuration
// =====================================================

// Path to template repo - can be overridden via env var
const TEMPLATE_PATH =
  process.env.MEDIA_KIT_TEMPLATE_PATH ||
  path.resolve(process.cwd(), "../ugc-template/media-kit");

// Files to copy from template (relative to template root)
const TEMPLATE_FILES = [
  // App files
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  // Components
  "components/brand-partners.tsx",
  "components/contact.tsx",
  "components/content-showcase.tsx",
  "components/hero.tsx",
  "components/image-gallery.tsx",
  "components/services.tsx",
  "components/stats.tsx",
  "components/ui/accordion.tsx",
  "components/video-showcase.tsx",
  // Lib
  "lib/utils.ts",
  // Config files
  "package.json",
  "tsconfig.json",
  "components.json",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
];

// =====================================================
// Creator Data Generation
// =====================================================

/**
 * Generate the creator.ts file content from onboarding data
 */
function generateCreatorDataFile(data: PortfolioData): string {
  // Convert social handles to template format
  const socialHandles = data.socialMediaHandles.map((h) => ({
    platform: h.platform,
    handle: h.handle,
  }));

  // Convert videos to template format
  const videos = data.videos.map((v) => ({
    url: v.url,
    title: v.title,
    platform: v.platform,
  }));

  // Convert images to template format
  const images = data.images.map((i) => ({
    url: i.url,
    alt: i.title || "",
    title: i.title || "",
    category: i.category || "",
  }));

  // Build the creator data object
  const creatorData = {
    name: data.name,
    email: data.email,
    niche: data.niche,
    tagline: data.tagline || `${data.niche} Creator`,
    bio: data.bio,
    location: data.location || "",
    socialHandles,
    brandPartnerships: data.brandPartnerships,
    videos,
    images,
    selectedServices: data.selectedServices,
  };

  return `// Creator Data Schema
// This file is auto-generated from onboarding data
// Generated at: ${new Date().toISOString()}

export interface SocialHandle {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "other"
  handle: string
  url?: string
  followerCount?: number
}

export interface BrandPartnership {
  name: string
  type: "paid" | "gifted" | "ambassador" | "affiliate" | "collaboration"
}

export interface Video {
  url: string
  title: string
  platform: "tiktok" | "instagram" | "youtube"
  thumbnailUrl?: string
  views?: string
  featured?: boolean
}

export interface Image {
  url: string
  alt: string
  title: string
  category: string
}

export interface Service {
  id: string
  title: string
  description: string
  deliverables: string[]
}

// Available services to choose from
export const AVAILABLE_SERVICES: Service[] = [
  {
    id: "ugc-videos",
    title: "UGC Video Creation",
    description:
      "High-quality, authentic video content created specifically for your brand. Includes product demonstrations, unboxings, testimonials, and lifestyle content optimized for your marketing channels.",
    deliverables: ["Raw footage", "Edited versions", "Multiple formats (9:16, 1:1, 16:9)", "Usage rights"],
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
]

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
] as const

export type Niche = (typeof NICHE_OPTIONS)[number]

export const PARTNERSHIP_TYPES = [
  { id: "paid", label: "Paid Partnership" },
  { id: "gifted", label: "Gifted" },
  { id: "ambassador", label: "Brand Ambassador" },
  { id: "affiliate", label: "Affiliate" },
  { id: "collaboration", label: "Collaboration" },
] as const

export interface CreatorData {
  name: string
  email: string
  niche: Niche
  tagline?: string
  bio: string
  location?: string
  socialHandles: SocialHandle[]
  brandPartnerships: BrandPartnership[]
  videos: Video[]
  images: Image[]
  selectedServices: string[]
  inspirationUrls?: string[]
  portfolioVision?: string
}

// Creator data populated from onboarding
export const creatorData: CreatorData = ${JSON.stringify(creatorData, null, 2)}

// Helper to get full service details from selected IDs
export function getSelectedServices(selectedIds: string[]): Service[] {
  return AVAILABLE_SERVICES.filter((service) => selectedIds.includes(service.id))
}

// Helper to build social URL from handle
export function getSocialUrl(handle: SocialHandle): string {
  if (handle.url) return handle.url

  const cleanHandle = handle.handle.replace("@", "")

  switch (handle.platform) {
    case "instagram":
      return \`https://instagram.com/\${cleanHandle}\`
    case "tiktok":
      return \`https://tiktok.com/@\${cleanHandle}\`
    case "youtube":
      return cleanHandle.startsWith("http") ? cleanHandle : \`https://youtube.com/@\${cleanHandle}\`
    case "twitter":
      return \`https://twitter.com/\${cleanHandle}\`
    case "linkedin":
      return cleanHandle.startsWith("http") ? cleanHandle : \`https://linkedin.com/in/\${cleanHandle}\`
    default:
      return "#"
  }
}
`;
}

// =====================================================
// Main Generation Function
// =====================================================

/**
 * Generate portfolio files from onboarding data
 * Returns an array of files ready to be pushed to GitHub
 */
export async function generatePortfolioFromTemplate(
  questionnaire: OnboardingQuestionnaire
): Promise<GenerationResult> {
  try {
    // Extract portfolio data from questionnaire
    const portfolioData: PortfolioData = {
      name: questionnaire.name || "Creator",
      email: questionnaire.email || "",
      niche: questionnaire.niche || "Lifestyle",
      tagline: questionnaire.tagline || undefined,
      bio: questionnaire.bio || "",
      location: questionnaire.location || undefined,
      socialMediaHandles: (questionnaire.socialMediaHandles || []) as SocialMediaHandle[],
      brandPartnerships: (questionnaire.brandPartnerships || []) as BrandPartnership[],
      videos: (questionnaire.videos || []) as VideoEntry[],
      images: (questionnaire.images || []) as ImageEntry[],
      selectedServices: questionnaire.selectedServices || [],
    };

    const files: GeneratedFile[] = [];

    // Copy template files
    for (const filePath of TEMPLATE_FILES) {
      try {
        const fullPath = path.join(TEMPLATE_PATH, filePath);
        const content = await fs.readFile(fullPath, "utf-8");
        files.push({ path: filePath, content });
      } catch (err) {
        // Skip missing optional files
        console.warn(`Template file not found: ${filePath}`);
      }
    }

    // Generate the customized creator.ts file
    const creatorDataContent = generateCreatorDataFile(portfolioData);
    files.push({
      path: "lib/data/creator.ts",
      content: creatorDataContent,
    });

    // Add README
    files.push({
      path: "README.md",
      content: `# ${portfolioData.name}'s Media Kit

Generated by UGC Community

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Deployment

This site is designed to be deployed on Vercel.
`,
    });

    return {
      files,
      success: true,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      files: [],
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Helper to convert questionnaire to portfolio data
 */
export function questionnaireToPortfolioData(
  questionnaire: OnboardingQuestionnaire
): PortfolioData {
  return {
    name: questionnaire.name || "Creator",
    email: questionnaire.email || "",
    niche: questionnaire.niche || "Lifestyle",
    tagline: questionnaire.tagline || undefined,
    bio: questionnaire.bio || "",
    location: questionnaire.location || undefined,
    socialMediaHandles: (questionnaire.socialMediaHandles || []) as SocialMediaHandle[],
    brandPartnerships: (questionnaire.brandPartnerships || []) as BrandPartnership[],
    videos: (questionnaire.videos || []) as VideoEntry[],
    images: (questionnaire.images || []) as ImageEntry[],
    selectedServices: questionnaire.selectedServices || [],
  };
}
