"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

export function LightboxTrigger({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="absolute inset-0 w-full h-full group/zoom flex items-end justify-end p-3"
      aria-label="View full size"
    >
      <span className="opacity-0 group-hover/zoom:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm text-white rounded-xl p-2 shadow-lg">
        <ZoomIn className="w-4 h-4" />
      </span>
    </button>
  );
}

export default function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="relative max-w-4xl max-h-[90vh] w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {alt}
      </p>
    </div>
  );
}
