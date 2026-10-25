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
  title: "ugc.community — UGC Job Board & Creator Opportunities",
  description:
    "Find UGC jobs and brand opportunities in one searchable feed. Browse reviewed external opportunities and directly posted jobs. Free for creators.",
  other: { "is-agentic-site-type": "app" },
  keywords: [
    "UGC",
    "creator",
    "user generated content",
    "brand deals",
    "influencer",
  ],
  openGraph: {
    title: "ugc.community — UGC Job Board & Creator Opportunities",
    description:
      "Find reviewed UGC jobs, clear compensation terms, and original application links. Free for creators.",
    images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "ugc.community — UGC jobs and creator opportunities" }],
    type: "website",
    locale: "en_US",
    siteName: "ugc.community",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/social-preview.png"],
    title: "ugc.community — UGC Job Board & Creator Opportunities",
    description:
      "Find reviewed UGC jobs, clear compensation terms, and original application links. Free for creators.",
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
      contactPoint: { "@type": "ContactPoint", email: "cody@isolated.tech", contactType: "customer support", url: "https://ugc.community/contact", availableLanguage: "English" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://ugc.community/#app",
      name: "ugc.community",
      url: "https://ugc.community/",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "A searchable UGC job board with reviewed external opportunities and free brand submissions.",
      provider: { "@id": "https://ugc.community/#organization" },
      featureList: [
        "Searchable UGC opportunities",
        "Free job submissions with manual review",
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
