import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SPORT_LABELS, AMENITY_LABELS, SURFACE_LABELS, DAY_LABELS } from "@/lib/constants";
import { AvailabilitySection } from "./availability-section";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select(`
      *,
      courts(id, name, sport_type, surface_type, is_indoor, max_players, price_per_hour, is_active),
      club_amenities(amenity),
      working_hours(day_of_week, open_time, close_time, is_closed),
      club_images(image_url, position)
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!club) notFound();

  const sports = [...new Set(
    club.courts
      ?.filter((c) => c.is_active)
      .map((c) => c.sport_type) ?? []
  )] as SportType[];

  const sortedHours = club.working_hours?.sort(
    (a, b) => a.day_of_week - b.day_of_week
  );

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="border-b bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {club.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {club.address_street}, {club.address_city}
            {club.address_postal_code && ` ${club.address_postal_code}`}
          </p>
          {sports.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sports.map((sport) => (
                <Badge key={sport} variant="secondary">
                  {SPORT_LABELS[sport]}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div className="space-y-8">
            {/* Availability */}
            <AvailabilitySection
              clubId={club.id}
              clubName={club.name}
              sports={sports}
            />

            {/* Description */}
            {club.description && (
              <section>
                <h2 className="mb-3 text-lg font-semibold">O klubu</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {club.description}
                </p>
              </section>
            )}

            {/* Courts */}
            <section>
              <h2 className="mb-3 text-lg font-semibold">Tereni</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {club.courts
                  ?.filter((c) => c.is_active)
                  .map((court) => (
                    <div
                      key={court.id}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{court.name}</span>
                        <span className="text-sm font-semibold">
                          {court.price_per_hour.toLocaleString()} RSD/h
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">
                          {SPORT_LABELS[court.sport_type]}
                        </Badge>
                        {court.surface_type && (
                          <Badge variant="outline" className="text-xs">
                            {SURFACE_LABELS[court.surface_type]}
                          </Badge>
                        )}
                        {court.is_indoor && (
                          <Badge variant="outline" className="text-xs">
                            Zatvoreno
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contact */}
            <div className="rounded-xl border p-4">
              <h3 className="mb-3 font-semibold">Kontakt</h3>
              <div className="space-y-2 text-sm">
                {club.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${club.phone}`} className="hover:text-foreground">
                      {club.phone}
                    </a>
                  </div>
                )}
                {club.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a href={`mailto:${club.email}`} className="hover:text-foreground">
                      {club.email}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {club.address_street}, {club.address_city}
                </div>
              </div>
            </div>

            {/* Working hours */}
            {sortedHours && sortedHours.length > 0 && (
              <div className="rounded-xl border p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4" />
                  Radno vreme
                </h3>
                <div className="space-y-1.5 text-sm">
                  {sortedHours.map((wh) => (
                    <div
                      key={wh.day_of_week}
                      className="flex justify-between"
                    >
                      <span className="text-muted-foreground">
                        {DAY_LABELS[wh.day_of_week]}
                      </span>
                      <span className="font-medium">
                        {wh.is_closed
                          ? "Zatvoreno"
                          : `${wh.open_time.slice(0, 5)} - ${wh.close_time.slice(0, 5)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {club.club_amenities && club.club_amenities.length > 0 && (
              <div className="rounded-xl border p-4">
                <h3 className="mb-3 font-semibold">Pogodnosti</h3>
                <div className="flex flex-wrap gap-1.5">
                  {club.club_amenities.map((a) => (
                    <Badge key={a.amenity} variant="secondary" className="text-xs">
                      {AMENITY_LABELS[a.amenity]}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
