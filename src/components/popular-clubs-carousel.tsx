"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ClubCard } from "@/components/club-card";
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

interface PopularClubsCarouselProps {
  clubs: ClubData[];
  isAuthenticated: boolean;
}

export function PopularClubsCarousel({
  clubs,
  isAuthenticated,
}: PopularClubsCarouselProps) {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: clubs.length > 3,
      }}
      className="w-full"
    >
      <CarouselContent className="-ml-4">
        {clubs.map((club) => (
          <CarouselItem
            key={club.id}
            className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
          >
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
          </CarouselItem>
        ))}
      </CarouselContent>
      {clubs.length > 3 && (
        <>
          <CarouselPrevious className="-left-4 hidden lg:flex" />
          <CarouselNext className="-right-4 hidden lg:flex" />
        </>
      )}
    </Carousel>
  );
}
