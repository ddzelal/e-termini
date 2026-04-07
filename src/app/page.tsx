import Link from "next/link";
import { Search, Calendar, Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ClubCard } from "@/components/club-card";
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
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center md:py-32">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Pronađi i rezerviši
          <br />
          <span className="text-primary">sportski teren</span>
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Pretraži klubove u tvom gradu, izaberi termin i rezerviši — brzo i
          jednostavno.
        </p>
        <div className="flex gap-3">
          <Link href="/clubs" className={buttonVariants({ size: "lg" })}>
            Pretraži klubove
          </Link>
        </div>
      </section>

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

      {/* How it works */}
      <section className="border-t bg-muted/50 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-semibold">
            Kako funkcioniše
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Search className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Pronađi</h3>
              <p className="text-sm text-muted-foreground">
                Pretraži klubove po gradu, sportu ili imenu.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Rezerviši</h3>
              <p className="text-sm text-muted-foreground">
                Izaberi slobodan termin i potvrdi rezervaciju.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Trophy className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Igraj</h3>
              <p className="text-sm text-muted-foreground">
                Dođi u klub, plati na licu mesta i uživaj u igri.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
