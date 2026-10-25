import { structuredData } from "@/lib/public-site/metadata";
import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
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
    images: [{ url: "/social-preview.png?v=brand-icon", width: 1200, height: 630, alt: "ugc.community — UGC jobs and creator opportunities" }],
    type: "website",
    locale: "en_US",
    siteName: "ugc.community",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/social-preview.png?v=brand-icon"],
    title: "ugc.community — UGC Job Board & Creator Opportunities",
    description:
      "Find reviewed UGC jobs, clear compensation terms, and original application links. Free for creators.",
  },
  alternates: { canonical: "/" },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${instrumentSerif.variable} ${outfit.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem("ugc.analytics.consent")!==null||navigator.doNotTrack==="1"||navigator.globalPrivacyControl)document.documentElement.dataset.analyticsPreference="set"}catch(e){document.documentElement.dataset.analyticsPreference="set"}})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        {children}
        <AIReferralTracker />
      </body>
    </html>
  );
}
