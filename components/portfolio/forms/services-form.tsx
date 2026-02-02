"use client";

import { useState } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import type { SectionContent } from "@/lib/db/schema";

interface ServicesFormProps {
  content: SectionContent | undefined;
  onChange: (content: SectionContent) => void;
}

export function ServicesForm({ content, onChange }: ServicesFormProps) {
  const [formData, setFormData] = useState({
    title: content?.title ?? "Services",
    subtitle: content?.subtitle ?? "",
    services: content?.services ?? [],
  });

  function handleChange(key: keyof typeof formData, value: unknown) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onChange(updated as SectionContent);
  }

  function addService() {
    const newServices = [
      ...(formData.services || []),
      { title: "", description: "", price: "" },
    ];
    handleChange("services", newServices);
  }

  function updateService(index: number, field: string, value: string) {
    const newServices = [...(formData.services || [])];
    newServices[index] = { ...newServices[index], [field]: value };
    handleChange("services", newServices);
  }

  function removeService(index: number) {
    const newServices = formData.services?.filter((_, i) => i !== index) ?? [];
    handleChange("services", newServices);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Services"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-gray-700 mb-1">
            Subtitle (optional)
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => handleChange("subtitle", e.target.value)}
            placeholder="What I offer"
            className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
          />
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-warm-gray-700">
            Services
          </label>
          <button
            type="button"
            onClick={addService}
            className="flex items-center gap-1 text-sm text-coral hover:text-coral/80"
          >
            <Plus size={14} />
            Add Service
          </button>
        </div>

        <div className="space-y-3">
          {formData.services?.map((service, index) => (
            <div
              key={index}
              className="p-4 bg-warm-gray-50 rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-warm-gray-400 mt-1" />
                  <span className="text-sm font-medium text-warm-gray-500">
                    Service {index + 1}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="p-1 text-warm-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 ml-6">
                <input
                  type="text"
                  value={service.title}
                  onChange={(e) => updateService(index, "title", e.target.value)}
                  placeholder="Service name"
                  className="px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
                <input
                  type="text"
                  value={service.price || ""}
                  onChange={(e) => updateService(index, "price", e.target.value)}
                  placeholder="Starting at $500"
                  className="px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
              </div>
              <textarea
                value={service.description}
                onChange={(e) =>
                  updateService(index, "description", e.target.value)
                }
                placeholder="Brief description of this service..."
                rows={2}
                className="w-full ml-6 px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
                style={{ width: "calc(100% - 1.5rem)" }}
              />
            </div>
          ))}

          {(!formData.services || formData.services.length === 0) && (
            <p className="text-sm text-warm-gray-500 text-center py-4">
              No services yet. Click "Add Service" to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
