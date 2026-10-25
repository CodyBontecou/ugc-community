import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { informationPages } from "@/lib/agent-content/pages";

export const metadata: Metadata = {
  title: informationPages.guide.title,
  description: informationPages.guide.description,
  alternates: { canonical: "/guide" },
};

export default function Page() { return <InformationPage name="guide" />; }
