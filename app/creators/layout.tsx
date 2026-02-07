import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Directory — ugc.community",
  description:
    "Browse UGC creators with live portfolios. Find the perfect content creator for your brand by niche, location, and availability.",
  openGraph: {
    title: "Creator Directory — ugc.community",
    description:
      "Browse UGC creators with live portfolios. Find the perfect content creator for your brand.",
    type: "website",
  },
};

export default function CreatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
