import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://ugc.community";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/post-job`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/tutorials`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/guide`, changeFrequency: "monthly", priority: 0.6 },
  ];

  return staticPages;
}
