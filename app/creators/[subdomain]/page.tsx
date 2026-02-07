import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCreatorBySubdomain } from "@/lib/directory/queries";
import { CreatorProfile } from "@/components/directory/creator-profile";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const creator = await getCreatorBySubdomain(subdomain);

  if (!creator) {
    return { title: "Creator Not Found — ugc.community" };
  }

  const name = creator.displayName || creator.name;
  const description =
    creator.tagline ||
    creator.bio ||
    `Check out ${name}'s portfolio on ugc.community`;

  return {
    title: `${name} — ugc.community`,
    description,
    openGraph: {
      title: `${name} — ugc.community`,
      description,
      type: "profile",
      ...(creator.image ? { images: [{ url: creator.image }] } : {}),
    },
  };
}

export default async function CreatorProfilePage({ params }: Props) {
  const { subdomain } = await params;
  const creator = await getCreatorBySubdomain(subdomain);

  if (!creator) {
    notFound();
  }

  return <CreatorProfile creator={creator} />;
}
