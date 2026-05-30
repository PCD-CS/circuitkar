"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ImageOff } from "lucide-react";

interface ProductImagesProps {
  images: string[];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const hasImages = images.length > 0;
  const current = hasImages ? images[Math.min(active, images.length - 1)] : null;

  const close = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close]);

  if (!hasImages || !current) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg border border-[#262626] bg-[#111111]">
        <div className="flex h-full w-full items-center justify-center">
          <ImageOff className="h-24 w-24 text-[#262626]" strokeWidth={1} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Main image */}
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label="Open image"
        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg border border-[#262626] bg-[#111111]"
      >
        <Image
          src={current}
          alt={productName}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-6"
          priority
        />
      </button>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.slice(0, 5).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded-lg border bg-[#111111] transition-colors ${
                i === active
                  ? "border-[#F97316]"
                  : "border-[#262626] hover:border-[#525252]"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#161616] text-[#A3A3A3] transition-colors hover:text-[#F5F5F5]"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[80vh] w-[90vw] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current}
              alt={productName}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
