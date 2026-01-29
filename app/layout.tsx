import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
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

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
