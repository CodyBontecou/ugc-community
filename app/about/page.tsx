import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { informationPages } from "@/lib/agent-content/pages";

export const metadata: Metadata = {
  title: informationPages.about.title,
  description: informationPages.about.description,
  alternates: { canonical: "/about" },
};

export default function Page() { return <InformationPage name="about" />; }
