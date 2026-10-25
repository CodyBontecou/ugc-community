import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { informationPages } from "@/lib/agent-content/pages";

export const metadata: Metadata = {
  title: informationPages.contact.title,
  description: informationPages.contact.description,
  alternates: { canonical: "/contact" },
};

export default function Page() { return <InformationPage name="contact" />; }
