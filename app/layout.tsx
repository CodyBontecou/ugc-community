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
  title: "UGC Creator Database — ugc.community",
  description:
    "Discover UGC creators, social profiles, portfolios, and shared contact details. Join early access to a searchable creator database for brands and agencies.",
  keywords: [
    "UGC",
    "creator",
    "user generated content",
    "brand deals",
    "influencer",
  ],
  openGraph: {
    title: "UGC Creator Database — ugc.community",
    description:
      "A searchable UGC creator database for brands and agencies. Join early access.",
    type: "website",
    locale: "en_US",
    siteName: "ugc.community",
  },
  twitter: {
    card: "summary_large_image",
    title: "UGC Creator Database — ugc.community",
    description:
      "A searchable UGC creator database for brands and agencies. Join early access.",
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
        "A UGC creator discovery database for brands and agencies. Subscription access is coming soon.",
      provider: { "@id": "https://ugc.community/#organization" },
      featureList: [
        "Searchable UGC creator database preview",
        "Subscription early-access registration",
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
