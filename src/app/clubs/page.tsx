import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClubsSearch } from "./clubs-search";

export const metadata: Metadata = {
  title: "Klubovi — Pronađi sportski teren",
  description: "Pretraži sportske klubove u Srbiji. Fudbal, tenis, padel, košarka i više. Rezerviši termin online.",
};
import { ClubGrid } from "./club-grid";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubsPageProps {
  searchParams: Promise<{ q?: string; city?: string; sport?: string }>;
}

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const { q, city, sport } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isSearching = !!(q || city || sport);

  let favoriteIds: string[] = [];
  if (user) {
    const { data: favs } = await supabase
      .from("favorite_clubs")
      .select("club_id")
      .eq("user_id", user.id);
    favoriteIds = favs?.map((f) => f.club_id) ?? [];
  }

  // Fetch all published clubs
  let query = supabase
    .from("clubs")
    .select("id, name, slug, address_street, address_city, courts(sport_type), club_images(image_url, position)")
    .eq("is_published", true)
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,address_city.ilike.%${q}%`);
  }
  if (city) {
    query = query.ilike("address_city", `%${city}%`);
  }

  const { data: clubs } = await query;

  // Filter by sport client-side
  const filteredClubs = sport
    ? clubs?.filter((club) =>
        club.courts?.some((c: { sport_type: string }) => c.sport_type === sport)
      )
    : clubs;

  // Get unique cities for filter
  const allCities = [...new Set(clubs?.map((c) => c.address_city) ?? [])].sort();

  // Get available sports
  const allSports = [
    ...new Set(
      clubs?.flatMap(
        (c) => c.courts?.map((ct: { sport_type: string }) => ct.sport_type) ?? []
      ) ?? []
    ),
  ] as SportType[];

  // Prepare all clubs for ClubGrid
  const preparedClubs = (filteredClubs ?? []).map((club) => {
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
  });

  return (
    <main className="flex-1">
      {/* Hero search section */}
      <section className="border-b bg-gradient-to-b from-primary/[0.03] to-transparent px-4 pb-8 pt-10">
        <div className="mx-auto max-w-6xl">
          <BlurFade>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Pronađi svoj teren
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pretraži {clubs?.length ?? 0}+ klubova i rezerviši termin za svoj omiljeni sport
            </p>
          </BlurFade>

          <BlurFade delay={0.1}>
            <div className="mt-6">
              <ClubsSearch
                defaultQuery={q}
                defaultCity={city}
                defaultSport={sport}
                cities={allCities}
                sports={allSports}
              />
            </div>
          </BlurFade>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        {isSearching ? (
          /* === SEARCH RESULTS === */
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                {preparedClubs.length} rezultata
              </h2>
              <p className="text-sm text-muted-foreground">
                {q && `"${q}"`}
                {city && ` u ${city}`}
                {sport && ` · ${sport}`}
              </p>
            </div>

            {preparedClubs.length > 0 ? (
              <ClubGrid
                clubs={preparedClubs}
                isAuthenticated={!!user}
                initialCount={6}
              />
            ) : (
              <div className="rounded-2xl border border-dashed py-20 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-lg font-medium">Nema rezultata</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pokušaj sa drugim terminom pretrage
                </p>
              </div>
            )}
          </div>
        ) : (
          /* === BROWSE MODE (no search) === */
          <div className="space-y-14">
            {/* Popular section */}
            {preparedClubs.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">🔥 Popularni klubovi</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Najtraženiji tereni na platformi
                  </p>
                </div>
                <ClubGrid
                  clubs={preparedClubs.slice(0, 6)}
                  isAuthenticated={!!user}
                  initialCount={3}
                  loadMoreCount={3}
                />
              </section>
            )}

            {/* All clubs */}
            {preparedClubs.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Svi klubovi</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pregled svih {preparedClubs.length} dostupnih klubova
                  </p>
                </div>
                <ClubGrid
                  clubs={preparedClubs}
                  isAuthenticated={!!user}
                  initialCount={6}
                  loadMoreCount={6}
                />
              </section>
            )}

            {preparedClubs.length === 0 && (
              <div className="rounded-2xl border border-dashed py-20 text-center">
                <div className="text-4xl mb-3">🏟️</div>
                <p className="text-lg font-medium">Uskoro dodajemo klubove</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Budite u toku — novi klubovi se dodaju svakodnevno
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
