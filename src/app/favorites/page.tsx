import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClubCard } from "@/components/club-card";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: favorites } = await supabase
    .from("favorite_clubs")
    .select(`
      id,
      clubs(id, name, slug, address_street, address_city, courts(sport_type), club_images(image_url, position))
    `)
    .eq("user_id", user.id);

  const clubs = favorites
    ?.map((f) => f.clubs)
    .filter(Boolean) as Array<{
    id: string;
    name: string;
    slug: string;
    address_street: string;
    address_city: string;
    courts: { sport_type: SportType }[];
    club_images: { image_url: string; position: number }[];
  }>;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          Omiljeni klubovi
        </h1>

        {clubs && clubs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => {
              const sports = [
                ...new Set(club.courts?.map((c) => c.sport_type) ?? []),
              ] as SportType[];
              const firstImage = club.club_images
                ?.sort((a, b) => a.position - b.position)
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
          <div className="rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground">
              Nemate omiljene klubove
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
