import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      // Training crawlers remain separate from search and user-directed retrieval.
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      // Block Anthropic crawlers
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/",
      },
      // Block Common Crawl (used for AI training)
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      // Block Google AI crawlers
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
      // Block Cohere AI
      {
        userAgent: "cohere-ai",
        disallow: "/",
      },
      // Block Facebook/Meta AI
      {
        userAgent: "FacebookBot",
        disallow: "/",
      },
      // Block Bytedance/TikTok AI
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
      // Block other known AI scrapers
      {
        userAgent: "YouBot",
        disallow: "/",
      },
      {
        userAgent: "Applebot-Extended",
        disallow: "/",
      },
      {
        userAgent: "Omgilibot",
        disallow: "/",
      },
      {
        userAgent: "Diffbot",
        disallow: "/",
      },
      // Block aggressive scrapers
      {
        userAgent: "SemrushBot",
        disallow: "/",
      },
      {
        userAgent: "AhrefsBot",
        disallow: "/",
      },
    ],
    sitemap: "https://ugc.community/sitemap.xml",
  };
}
