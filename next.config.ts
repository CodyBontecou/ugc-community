import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const resolvedVercelBlobEntry = import.meta.resolve("@vercel/blob");
const vercelBlobEntry = resolvedVercelBlobEntry.startsWith("file:")
  ? fileURLToPath(resolvedVercelBlobEntry)
  : resolvedVercelBlobEntry;
const workerdFetchShim = path.join(
  path.dirname(vercelBlobEntry),
  "undici-browser.js"
);

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Avoid a render-blocking stylesheet round trip on cold mobile visits.
  experimental: {
    inlineCss: true,
  },

  // Vercel Blob imports undici directly for Node.js. Cloudflare workerd's
  // Node TLS shim does not implement undici's ALPN options, so use the package's
  // own browser transport, which delegates to the Workers-native fetch API.
  webpack(config, { isServer }) {
    if (isServer) {
      config.resolve.alias.undici = workerdFetchShim;
    }
    return config;
  },

  // Image optimization configuration for external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
