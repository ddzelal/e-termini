import { createClient } from "@/lib/supabase/server";
import { ClubCard } from "@/components/club-card";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubsPageProps {
  searchParams: Promise<{ q?: string; city?: string; sport?: string }>;
}

export default async function ClubsPage({ searchParams }: ClubsPageProps) {
  const { q, city, sport } = await searchParams;
  const supabase = await createClient();

  // Fetch published clubs with their courts (for sport badges)
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

  // Filter by sport client-side (courts is a join)
  const filteredClubs = sport
    ? clubs?.filter((club) =>
        club.courts?.some((c: { sport_type: string }) => c.sport_type === sport)
      )
    : clubs;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Search header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Klubovi</h1>
          <p className="mt-1 text-muted-foreground">
            Pronađi sportski teren i rezerviši termin
          </p>
        </div>

        {/* Search bar */}
        <form className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Pretraži po imenu ili gradu..."
              defaultValue={q}
              className="h-11 pl-10"
            />
          </div>
        </form>

        {/* Results */}
        {filteredClubs && filteredClubs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClubs.map((club) => {
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
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Nema pronađenih klubova
            </p>
            {q && (
              <p className="mt-1 text-sm text-muted-foreground">
                Pokušajte sa drugim terminom pretrage
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
