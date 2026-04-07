"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MagicCard } from "@/components/ui/magic-card";
import { SPORT_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubCardProps {
  slug: string;
  name: string;
  addressStreet: string;
  addressCity: string;
  sports: SportType[];
  imageUrl?: string | null;
}

export function ClubCard({
  slug,
  name,
  addressStreet,
  addressCity,
  sports,
  imageUrl,
}: ClubCardProps) {
  return (
    <MagicCard
      className="group overflow-hidden rounded-xl p-0"
      gradientColor="oklch(0.55 0.18 155 / 0.08)"
    >
      {/* Image placeholder */}
      <div className="relative aspect-[16/10] bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-muted-foreground/20 font-bold">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {addressStreet}, {addressCity}
          </p>
        </div>

        {sports.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sports.map((sport) => (
              <Badge key={sport} variant="secondary" className="text-xs">
                {SPORT_LABELS[sport]}
              </Badge>
            ))}
          </div>
        )}

        <Link
          href={`/clubs/${slug}`}
          className={buttonVariants({ size: "sm", className: "w-full" })}
        >
          Rezerviši
        </Link>
      </div>
    </MagicCard>
  );
}
