import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import AIReferralTracker from "@/components/analytics/ai-referral-tracker";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFF5F3",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://ugc.community"),
  title: "ugc.community - For UGC Creators",
  description:
    "The modern way for content creators to showcase their work and land brand deals. Your own corner of the internet at yourname.ugc.community",
  keywords: [
    "UGC",
    "creator",
    "user generated content",
    "brand deals",
    "influencer",
  ],
  openGraph: {
    title: "ugc.community - For UGC Creators",
    description:
      "The modern way for content creators to showcase their work and land brand deals.",
    type: "website",
    locale: "en_US",
    siteName: "ugc.community",
  },
  twitter: {
    card: "summary_large_image",
    title: "ugc.community - For UGC Creators",
    description:
      "The modern way for content creators to showcase their work and land brand deals.",
  },
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ugc.community/#organization",
      name: "ugc.community",
      url: "https://ugc.community/",
      email: "cody@isolated.tech",
    },
    {
      "@type": "WebApplication",
      "@id": "https://ugc.community/#app",
      name: "ugc.community",
      url: "https://ugc.community/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Portfolio hosting, creator discovery, campaign hooks, milestone rewards, and analytics for UGC creators.",
      provider: { "@id": "https://ugc.community/#organization" },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Creator Partner access is free with qualifying content participation.",
      },
      featureList: [
        "Creator portfolio subdomains",
        "UGC job board and campaign hooks",
        "Automatic TikTok post matching",
        "Portfolio and post analytics",
        "Milestone-based creator rewards",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://ugc.community/#website",
      name: "ugc.community",
      url: "https://ugc.community/",
      publisher: { "@id": "https://ugc.community/#organization" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${outfit.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
        <AIReferralTracker />
      </body>
    </html>
  );
}
