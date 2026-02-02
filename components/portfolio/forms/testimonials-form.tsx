"use client";

import { useState } from "react";
import { Plus, X, GripVertical, Quote } from "lucide-react";
import type { SectionContent } from "@/lib/db/schema";

interface TestimonialsFormProps {
  content: SectionContent | undefined;
  onChange: (content: SectionContent) => void;
}

export function TestimonialsForm({ content, onChange }: TestimonialsFormProps) {
  const [formData, setFormData] = useState({
    title: content?.title ?? "What Clients Say",
    testimonials: content?.testimonials ?? [],
  });

  function handleChange(key: keyof typeof formData, value: unknown) {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onChange(updated as SectionContent);
  }

  function addTestimonial() {
    const newTestimonials = [
      ...(formData.testimonials || []),
      { quote: "", name: "", company: "" },
    ];
    handleChange("testimonials", newTestimonials);
  }

  function updateTestimonial(index: number, field: string, value: string) {
    const newTestimonials = [...(formData.testimonials || [])];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    handleChange("testimonials", newTestimonials);
  }

  function removeTestimonial(index: number) {
    const newTestimonials =
      formData.testimonials?.filter((_, i) => i !== index) ?? [];
    handleChange("testimonials", newTestimonials);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-warm-gray-700 mb-1">
          Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="What Clients Say"
          className="w-full px-4 py-2 border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
        />
      </div>

      {/* Testimonials */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-warm-gray-700">
            Testimonials
          </label>
          <button
            type="button"
            onClick={addTestimonial}
            className="flex items-center gap-1 text-sm text-coral hover:text-coral/80"
          >
            <Plus size={14} />
            Add Testimonial
          </button>
        </div>

        <div className="space-y-3">
          {formData.testimonials?.map((testimonial, index) => (
            <div
              key={index}
              className="p-4 bg-warm-gray-50 rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical size={16} className="text-warm-gray-400" />
                  <Quote size={16} className="text-warm-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => removeTestimonial(index)}
                  className="p-1 text-warm-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>

              <textarea
                value={testimonial.quote}
                onChange={(e) =>
                  updateTestimonial(index, "quote", e.target.value)
                }
                placeholder="What they said about working with you..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={testimonial.name}
                  onChange={(e) =>
                    updateTestimonial(index, "name", e.target.value)
                  }
                  placeholder="Client name"
                  className="px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
                <input
                  type="text"
                  value={testimonial.company || ""}
                  onChange={(e) =>
                    updateTestimonial(index, "company", e.target.value)
                  }
                  placeholder="Company / Role"
                  className="px-3 py-2 text-sm border border-warm-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral/50"
                />
              </div>
            </div>
          ))}

          {(!formData.testimonials || formData.testimonials.length === 0) && (
            <p className="text-sm text-warm-gray-500 text-center py-4">
              No testimonials yet. Click "Add Testimonial" to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
