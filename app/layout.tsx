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
  title: "ugc.community - Beautiful UGC Creator Portfolios",
  description:
    "Create a stunning portfolio that showcases your content and lands you brand deals. Your own corner of the internet at yourname.ugc.community",
  keywords: [
    "UGC",
    "creator",
    "portfolio",
    "user generated content",
    "brand deals",
    "influencer",
  ],
  openGraph: {
    title: "ugc.community - Beautiful UGC Creator Portfolios",
    description:
      "Create a stunning portfolio that showcases your content and lands you brand deals.",
    type: "website",
    locale: "en_US",
    siteName: "ugc.community",
  },
  twitter: {
    card: "summary_large_image",
    title: "ugc.community - Beautiful UGC Creator Portfolios",
    description:
      "Create a stunning portfolio that showcases your content and lands you brand deals.",
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
