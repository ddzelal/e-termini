import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ClubCard } from "@/components/club-card";
import { HeroSection, HowItWorks } from "@/components/hero-section";
import { SportsMarquee } from "@/components/sports-marquee";
import { PopularClubsCarousel } from "@/components/popular-clubs-carousel";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name, slug, address_street, address_city, courts(sport_type), club_images(image_url, position)")
    .eq("is_published", true)
    .limit(9);

  let favoriteIds: string[] = [];
  if (user) {
    const { data: favs } = await supabase
      .from("favorite_clubs")
      .select("club_id")
      .eq("user_id", user.id);
    favoriteIds = favs?.map((f) => f.club_id) ?? [];
  }

  const clubCards = clubs?.map((club) => {
    const sports = [
      ...new Set(
        club.courts?.map((c: { sport_type: SportType }) => c.sport_type) ?? []
      ),
    ] as SportType[];

    const firstImage = club.club_images
      ?.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      ?.[0]?.image_url;

    return {
      id: club.id,
      slug: club.slug,
      name: club.name,
      addressStreet: club.address_street,
      addressCity: club.address_city,
      sports,
      imageUrl: firstImage,
      isFavorited: favoriteIds.includes(club.id),
    };
  }) ?? [];

  return (
    <main className="flex-1">
      <HeroSection />

      <SportsMarquee />

      {/* Popular clubs */}
      {clubCards.length > 0 && (
        <section className="border-t px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Popularni klubovi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Najtraženiji tereni u tvojoj blizini
                </p>
              </div>
              <Link
                href="/clubs"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Vidi sve
              </Link>
            </div>
            <PopularClubsCarousel
              clubs={clubCards}
              isAuthenticated={!!user}
            />
          </div>
        </section>
      )}

      <HowItWorks />
    </main>
  );
}
