"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { GlareHover } from "@/components/ui/glare-hover";
import { AuthModal } from "@/components/auth-modal";
import { toggleFavorite } from "@/lib/favorite-actions";
import { SPORT_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubCardProps {
  slug: string;
  clubId: string;
  name: string;
  addressStreet: string;
  addressCity: string;
  sports: SportType[];
  imageUrl?: string | null;
  isFavorited?: boolean;
  isAuthenticated?: boolean;
}

export function ClubCard({
  slug,
  clubId,
  name,
  addressStreet,
  addressCity,
  sports,
  imageUrl,
  isFavorited = false,
  isAuthenticated = false,
}: ClubCardProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [animating, setAnimating] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setAnimating(true);
    const result = await toggleFavorite(clubId);

    if (result.error === "not_authenticated") {
      setAuthOpen(true);
    } else if ("favorited" in result) {
      setFavorited(!!result.favorited);
    }
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <>
      <Link href={`/clubs/${slug}`} className="block">
        <GlareHover
          color="#059669"
          opacity={0.12}
          angle={-35}
          duration={500}
          width="100%"
          className="rounded-2xl"
          background="transparent"
        >
          <div className="group w-full overflow-hidden rounded-2xl border border-border/50 bg-card transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5 dark:border-white/10 dark:hover:border-white/15">
            {/* Image */}
            <div className="relative aspect-[16/10] overflow-hidden bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <span className="text-5xl font-bold text-primary/20">
                    {name.charAt(0)}
                  </span>
                </div>
              )}

              {/* Gradient overlay on bottom of image */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

              {/* Favorite button */}
              <button
                onClick={handleFavorite}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-all hover:bg-black/50 active:scale-90"
              >
                <motion.div
                  animate={animating ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      favorited
                        ? "fill-red-500 text-red-500"
                        : "text-white/80 hover:text-white"
                    }`}
                  />
                </motion.div>
              </button>

              {/* Sport badges on image */}
              {sports.length > 0 && (
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
                  {sports.map((sport) => (
                    <span
                      key={sport}
                      className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-md"
                    >
                      {SPORT_LABELS[sport]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold leading-tight transition-colors group-hover:text-primary">
                {name}
              </h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{addressStreet}, {addressCity}</span>
              </p>
            </div>
          </div>
        </GlareHover>
      </Link>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
