import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow legitimate search engines
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/"],
      },
      // Block OpenAI crawlers
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
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
        userAgent: "PerplexityBot",
        disallow: "/",
      },
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
