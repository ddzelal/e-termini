"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClubCard } from "@/components/club-card";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubData {
  id: string;
  slug: string;
  name: string;
  addressStreet: string;
  addressCity: string;
  sports: SportType[];
  imageUrl?: string | null;
  isFavorited: boolean;
}

interface ClubGridProps {
  clubs: ClubData[];
  isAuthenticated: boolean;
  initialCount?: number;
  loadMoreCount?: number;
}

export function ClubGrid({
  clubs,
  isAuthenticated,
  initialCount = 6,
  loadMoreCount = 6,
}: ClubGridProps) {
  const [visible, setVisible] = useState(initialCount);

  const displayed = clubs.slice(0, visible);
  const hasMore = visible < clubs.length;
  const remaining = clubs.length - visible;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((club, i) => (
          <BlurFade key={club.id} delay={i >= visible - loadMoreCount ? 0.05 * (i - (visible - loadMoreCount)) : 0} inView>
            <ClubCard
              clubId={club.id}
              slug={club.slug}
              name={club.name}
              addressStreet={club.addressStreet}
              addressCity={club.addressCity}
              sports={club.sports}
              imageUrl={club.imageUrl}
              isFavorited={club.isFavorited}
              isAuthenticated={isAuthenticated}
            />
          </BlurFade>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisible((prev) => prev + loadMoreCount)}
            className="group flex items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-white/10 dark:hover:border-primary/30"
          >
            Prikaži još {Math.min(remaining, loadMoreCount)} od {remaining}
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
