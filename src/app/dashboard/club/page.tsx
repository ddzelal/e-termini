import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { ClubForm } from "@/components/admin/club-form";
import { CourtsSection } from "@/app/admin/clubs/[id]/edit/courts-section";
import { BlurFade } from "@/components/ui/blur-fade";
import { ClubSelector } from "./club-selector";

interface DashboardClubPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function DashboardClubPage({ searchParams }: DashboardClubPageProps) {
  const params = await searchParams;
  const { clubs, role } = await getOwnerClubs();

  if (clubs.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <div className="text-4xl mb-3">🏟️</div>
        <p className="text-lg font-medium">Nemate dodeljeni klub</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kontaktirajte administratora da vam dodeli klub
        </p>
      </div>
    );
  }

  // Admin can select which club to edit, owner always sees their own
  const clubId = (role === "admin" && params.id && clubs.some((c) => c.id === params.id))
    ? params.id
    : clubs[0].id;

  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select(`
      *,
      working_hours(day_of_week, open_time, close_time, is_closed),
      club_amenities(amenity),
      courts(
        id, name, sport_type, surface_type, is_indoor, max_players, price_per_hour, is_active,
        court_pricing_rules(id, day_of_week, start_time, end_time, price_per_hour)
      )
    `)
    .eq("id", clubId)
    .single();

  if (!club) redirect("/dashboard");

  const workingHours = club.working_hours?.map((wh) => ({
    day_of_week: wh.day_of_week,
    open_time: wh.open_time.slice(0, 5),
    close_time: wh.close_time.slice(0, 5),
    is_closed: wh.is_closed,
  }));

  const amenities = club.club_amenities?.map((a) => a.amenity);
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <BlurFade>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moj klub</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upravljaj podacima, terenima i cenama
            </p>
          </div>
          {/* Admin: club selector */}
          {isAdmin && clubs.length > 1 && (
            <ClubSelector clubs={clubs} currentId={clubId} />
          )}
        </div>
      </BlurFade>

      {/* Club info card */}
      <BlurFade delay={0.05}>
        <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#059669] to-[#C8FC2C] text-sm font-extrabold text-white">
              {club.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-semibold">{club.name}</h2>
              <p className="text-xs text-muted-foreground">
                {club.address_city} · {club.is_published ? "Objavljen" : "Nacrt"}
                {club.courts && ` · ${club.courts.filter((c) => c.is_active).length} terena`}
              </p>
            </div>
          </div>

          <ClubForm
            club={club}
            workingHours={workingHours}
            amenities={amenities}
            isAdmin={isAdmin}
          />
        </div>
      </BlurFade>

      {/* Courts */}
      <BlurFade delay={0.1}>
        <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
          <CourtsSection clubId={club.id} courts={club.courts ?? []} />
        </div>
      </BlurFade>
    </div>
  );
}
