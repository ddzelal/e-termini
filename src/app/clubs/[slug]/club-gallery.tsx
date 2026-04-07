"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Camera, ImageOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClubGalleryProps {
  images: { image_url: string; position: number }[];
  clubName: string;
}

function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted ${className}`}>
        <ImageOff className="h-6 w-6 text-muted-foreground/40" />
        <span className="mt-1 text-[10px] text-muted-foreground/50">Slika nedostupna</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 animate-pulse bg-muted rounded-[inherit]`} />
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

export function ClubGallery({ images, clubName }: ClubGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const next = useCallback(() => {
    if (lightbox === null) return;
    setLightbox((lightbox + 1) % images.length);
  }, [lightbox, images.length]);

  const prev = useCallback(() => {
    if (lightbox === null) return;
    setLightbox((lightbox - 1 + images.length) % images.length);
  }, [lightbox, images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightbox === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }

    // Prevent body scroll
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightbox, next, prev]);

  return (
    <>
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Galerija</h2>
          <span className="text-sm text-muted-foreground">({images.length})</span>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
          {images.map((img, i) => (
            <button
              key={img.image_url}
              onClick={() => setLightbox(i)}
              className="group shrink-0 snap-start overflow-hidden rounded-xl border border-border/50 dark:border-white/10 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <ImageWithFallback
                src={img.image_url}
                alt={`${clubName} - ${i + 1}`}
                className="h-28 w-44 sm:h-32 sm:w-52 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox modal */}
      <AnimatePresence>
        {lightbox !== null && (
          <>
            {/* Backdrop — blurs the entire page behind */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xl"
              onClick={() => setLightbox(null)}
            />

            {/* Modal content */}
            <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
              {/* Close button */}
              <button
                onClick={() => setLightbox(null)}
                className="pointer-events-auto absolute top-4 right-4 sm:top-6 sm:right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Counter */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 z-10">
                {lightbox + 1} / {images.length}
              </div>

              {/* Prev button */}
              {images.length > 1 && (
                <button
                  onClick={prev}
                  className="pointer-events-auto absolute left-2 sm:left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Image */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={lightbox}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
                  className="pointer-events-auto"
                >
                  <img
                    src={images[lightbox].image_url}
                    alt={`${clubName} - ${lightbox + 1}`}
                    className="max-h-[80vh] max-w-[85vw] sm:max-w-[75vw] rounded-xl object-contain select-none"
                    draggable={false}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Next button */}
              {images.length > 1 && (
                <button
                  onClick={next}
                  className="pointer-events-auto absolute right-2 sm:right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}

              {/* Bottom dots */}
              {images.length > 1 && (
                <div className="pointer-events-auto absolute bottom-4 sm:bottom-6 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      className={`rounded-full transition-all ${
                        i === lightbox
                          ? "h-2 w-6 bg-white"
                          : "h-2 w-2 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
