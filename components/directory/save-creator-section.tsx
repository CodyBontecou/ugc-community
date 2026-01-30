"use client";

import { useSavedCreators } from "@/lib/hooks/use-saved-creators";
import { useBrandUser } from "@/lib/hooks/use-brand-user";
import { SaveCreatorButton } from "./save-creator-button";

interface SaveCreatorSectionProps {
  creatorId: string;
}

export function SaveCreatorSection({ creatorId }: SaveCreatorSectionProps) {
  const { isBrand, isLoading: isBrandLoading } = useBrandUser();
  const { isSaved, isSaving, toggleSave } = useSavedCreators();

  // Only show for brand users
  if (isBrandLoading || !isBrand) {
    return null;
  }

  return (
    <SaveCreatorButton
      isSaved={isSaved(creatorId)}
      isSaving={isSaving.has(creatorId)}
      onToggle={() => toggleSave(creatorId)}
      size="md"
    />
  );
}
