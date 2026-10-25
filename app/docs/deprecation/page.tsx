import type { Metadata } from "next";
import { InformationPage } from "@/components/information-page";
import { informationPages } from "@/lib/agent-content/pages";
export const metadata: Metadata = { title: informationPages.deprecation.title, description: informationPages.deprecation.description, alternates: { canonical: "/docs/deprecation" } };
export default function Page() { return <InformationPage name="deprecation" />; }
