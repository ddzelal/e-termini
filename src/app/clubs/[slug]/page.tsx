import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Clock, Users, Layers, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";
import { ClubHeroBackground } from "./club-hero-bg";
import { SPORT_LABELS, AMENITY_LABELS, SURFACE_LABELS, DAY_LABELS } from "@/lib/constants";
import { AvailabilitySection } from "./availability-section";
import { FavoriteButton } from "./favorite-button";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", padel: "🏓",
  volleyball: "🏐", handball: "🤾", futsal: "⚽", other: "🏅",
};

const AMENITY_ICONS: Record<string, string> = {
  parking: "🅿️", free_parking: "🅿️", changing_room: "🚪", showers: "🚿",
  lockers: "🔐", wifi: "📶", cafeteria: "☕", restaurant: "🍽️",
  equipment_rental: "🎒", store: "🛒", disabled_access: "♿",
  lighting: "💡", covered: "🏠", air_conditioning: "❄️", heating: "🔥",
};

interface ClubPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClubPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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

  // Check if favorited
  let isFavorited = false;
  if (user) {
    const { data: fav } = await supabase
      .from("favorite_clubs")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", club.id)
      .single();
    isFavorited = !!fav;
  }

  const activeCourts = club.courts?.filter((c) => c.is_active) ?? [];
  const sports = [...new Set(activeCourts.map((c) => c.sport_type))] as SportType[];
  const minPrice = Math.min(...activeCourts.map((c) => c.price_per_hour));

  const sortedHours = club.working_hours?.sort((a, b) => a.day_of_week - b.day_of_week);
  const todayDow = (new Date().getDay() + 6) % 7; // Convert to 0=Mon
  const todayHours = sortedHours?.find((h) => h.day_of_week === todayDow);

  return (
    <main className="flex-1">
      {/* Hero */}
      <BlurFade>
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/[0.04] to-transparent px-4 pb-6 pt-8 sm:pb-8 sm:pt-10 md:pt-12 md:pb-10">
          <ClubHeroBackground />
          <div className="relative mx-auto max-w-6xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 sm:space-y-3 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                  {club.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>
                    {club.address_street}, {club.address_city}
                    {club.address_postal_code && ` ${club.address_postal_code}`}
                  </span>
                </div>
                {/* Sport badges */}
                {sports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sports.map((sport) => (
                      <span
                        key={sport}
                        className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/30 px-2.5 py-1 text-sm font-medium dark:border-white/10"
                      >
                        <span className="text-base leading-none">{SPORT_ICONS[sport]}</span>
                        {SPORT_LABELS[sport]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Favorite */}
              <FavoriteButton
                clubId={club.id}
                isFavorited={isFavorited}
                isAuthenticated={!!user}
              />
            </div>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>{activeCourts.length} terena</span>
              </div>
              {todayHours && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {todayHours.is_closed
                      ? "Danas zatvoreno"
                      : `Danas ${todayHours.open_time.slice(0, 5)} - ${todayHours.close_time.slice(0, 5)}`}
                  </span>
                </div>
              )}
              {minPrice > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    od {minPrice.toLocaleString()} RSD/h
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </BlurFade>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-10">
            {/* Availability — main feature */}
            <BlurFade delay={0.1}>
              <AvailabilitySection
                clubId={club.id}
                clubName={club.name}
                sports={sports}
              />
            </BlurFade>

            {/* Courts */}
            <BlurFade delay={0.15} inView>
              <section>
                <h2 className="mb-4 text-lg font-semibold">Tereni i cene</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeCourts.map((court) => (
                    <div
                      key={court.id}
                      className="rounded-xl border border-border/50 p-4 transition-colors hover:bg-muted/20 dark:border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{court.name}</h3>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="flex items-center gap-1 rounded-md bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary">
                              {SPORT_ICONS[court.sport_type]} {SPORT_LABELS[court.sport_type]}
                            </span>
                            {court.surface_type && (
                              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {SURFACE_LABELS[court.surface_type]}
                              </span>
                            )}
                            {court.is_indoor && (
                              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Zatvoreno
                              </span>
                            )}
                            {court.max_players && (
                              <span className="flex items-center gap-0.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {court.max_players}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-lg font-bold">
                            {court.price_per_hour.toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground"> RSD/h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </BlurFade>

            {/* Description */}
            {club.description && (
              <BlurFade delay={0.2} inView>
                <section>
                  <h2 className="mb-3 text-lg font-semibold">O klubu</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {club.description}
                  </p>
                </section>
              </BlurFade>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Contact card */}
            <BlurFade delay={0.1} inView>
              <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                  Kontakt
                </h3>
                <div className="space-y-3">
                  {club.phone && (
                    <a
                      href={`tel:${club.phone}`}
                      className="flex items-center gap-3 rounded-xl border border-border/50 p-3 text-sm transition-colors hover:bg-muted/30 dark:border-white/10"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Telefon</p>
                        <p className="font-medium">{club.phone}</p>
                      </div>
                    </a>
                  )}
                  {club.email && (
                    <a
                      href={`mailto:${club.email}`}
                      className="flex items-center gap-3 rounded-xl border border-border/50 p-3 text-sm transition-colors hover:bg-muted/30 dark:border-white/10"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{club.email}</p>
                      </div>
                    </a>
                  )}
                  <div className="flex items-center gap-3 rounded-xl border border-border/50 p-3 text-sm dark:border-white/10">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/8">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Adresa</p>
                      <p className="font-medium">{club.address_street}, {club.address_city}</p>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>

            {/* Working hours */}
            {sortedHours && sortedHours.length > 0 && (
              <BlurFade delay={0.15} inView>
                <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Radno vreme
                  </h3>
                  <div className="space-y-2">
                    {sortedHours.map((wh) => {
                      const isToday = wh.day_of_week === todayDow;
                      return (
                        <div
                          key={wh.day_of_week}
                          className={`flex justify-between rounded-lg px-2.5 py-1.5 text-sm ${
                            isToday ? "bg-primary/8 font-medium" : ""
                          }`}
                        >
                          <span className={isToday ? "text-primary" : "text-muted-foreground"}>
                            {DAY_LABELS[wh.day_of_week]}
                            {isToday && " (danas)"}
                          </span>
                          <span className={`font-medium ${wh.is_closed ? "text-destructive" : ""}`}>
                            {wh.is_closed
                              ? "Zatvoreno"
                              : `${wh.open_time.slice(0, 5)} - ${wh.close_time.slice(0, 5)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BlurFade>
            )}

            {/* Amenities */}
            {club.club_amenities && club.club_amenities.length > 0 && (
              <BlurFade delay={0.2} inView>
                <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Pogodnosti
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {club.club_amenities.map((a) => (
                      <div
                        key={a.amenity}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm"
                      >
                        <span className="text-base leading-none">{AMENITY_ICONS[a.amenity] ?? "✓"}</span>
                        <span className="text-muted-foreground">{AMENITY_LABELS[a.amenity]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
