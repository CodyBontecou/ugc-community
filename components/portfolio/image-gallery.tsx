"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { CreatorData } from "@/lib/portfolio/creator-data";

export function ImageGallery({ creator }: { creator: CreatorData }) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const { images } = creator;

  if (images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedImage(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    }
  };

  const goToNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
    }
  };

  return (
    <section id="gallery" className="border-t border-border px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Image Gallery
        </p>
        <h2 className="mt-4 text-2xl font-semibold text-foreground md:text-3xl text-balance">
          Photography & Stills
        </h2>
        <p className="mt-3 text-muted-foreground">
          High-quality product photography and lifestyle content
        </p>

        <div className="mt-10 columns-2 gap-4 md:columns-3">
          {images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="mb-4 break-inside-avoid cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <div className="relative overflow-hidden rounded-lg bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-3 pt-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium text-background">{image.title}</p>
                  <p className="text-xs text-background/70">{image.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background hover:bg-background/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background hover:bg-background/20 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[selectedImage].url}
              alt={images[selectedImage].alt}
              className="max-h-[85vh] w-auto object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-12 rounded-b-lg">
              <p className="text-base font-medium text-background">
                {images[selectedImage].title}
              </p>
              <p className="text-sm text-background/70">{images[selectedImage].category}</p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background hover:bg-background/20 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
