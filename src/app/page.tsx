import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ClubCard } from "@/components/club-card";
import { HeroSection, HowItWorks } from "@/components/hero-section";
import { SportsMarquee } from "@/components/sports-marquee";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug, address_street, address_city, courts(sport_type), club_images(image_url, position)")
    .eq("is_published", true)
    .limit(6);

  return (
    <main className="flex-1">
      <HeroSection />

      <SportsMarquee />

      {/* Popular clubs */}
      {clubs && clubs.length > 0 && (
        <section className="border-t px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Popularni klubovi</h2>
              <Link
                href="/clubs"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Vidi sve
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club) => {
                const sports = [
                  ...new Set(
                    club.courts?.map((c: { sport_type: SportType }) => c.sport_type) ?? []
                  ),
                ] as SportType[];

                const firstImage = club.club_images
                  ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
                  ?.[0]?.image_url;

                return (
                  <ClubCard
                    key={club.id}
                    slug={club.slug}
                    name={club.name}
                    addressStreet={club.address_street}
                    addressCity={club.address_city}
                    sports={sports}
                    imageUrl={firstImage}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <HowItWorks />
    </main>
  );
}
