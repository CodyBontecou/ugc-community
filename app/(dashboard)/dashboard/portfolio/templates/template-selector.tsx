"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateCard } from "@/components/portfolio/template-card";
import type { Template } from "@/lib/db/schema";

interface TemplateSelectorProps {
  templates: Template[];
  currentTemplateId: string | null;
}

export function TemplateSelector({
  templates,
  currentTemplateId,
}: TemplateSelectorProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(currentTemplateId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(template: Template) {
    // If already selected, just navigate to editor
    if (template.id === currentTemplateId) {
      router.push("/dashboard/portfolio");
      return;
    }

    setSelectedId(template.id);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/select-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to select template");
      }

      // Redirect to portfolio editor
      router.push("/dashboard/portfolio");
      router.refresh();
    } catch (err) {
      console.error("Failed to select template:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSelectedId(currentTemplateId);
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedId === template.id}
            onSelect={handleSelect}
            isLoading={isLoading && selectedId === template.id}
          />
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-warm-gray-500">No templates available yet.</p>
        </div>
      )}
    </div>
  );
}
