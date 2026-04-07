import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubForm } from "@/components/admin/club-form";
import { CourtsSection } from "./courts-section";
import { OwnerSection } from "./owner-section";
import { BlurFade } from "@/components/ui/blur-fade";

interface EditClubPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClubPage({ params }: EditClubPageProps) {
  const { id } = await params;
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
    .eq("id", id)
    .single();

  if (!club) notFound();

  const workingHours = club.working_hours?.map((wh) => ({
    day_of_week: wh.day_of_week,
    open_time: wh.open_time.slice(0, 5),
    close_time: wh.close_time.slice(0, 5),
    is_closed: wh.is_closed,
  }));

  const amenities = club.club_amenities?.map((a) => a.amenity);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{club.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {club.address_city} · {club.is_published ? "Objavljen" : "Nacrt"}
          </p>
        </div>
      </BlurFade>

      {/* Owner — most important for admin */}
      <BlurFade delay={0.05}>
        <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
          <OwnerSection clubId={club.id} currentOwnerId={club.owner_id} />
        </div>
      </BlurFade>

      {/* Club details form */}
      <BlurFade delay={0.1}>
        <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
          <h2 className="mb-5 text-lg font-semibold">Podaci o klubu</h2>
          <ClubForm
            club={club}
            workingHours={workingHours}
            amenities={amenities}
            isAdmin
          />
        </div>
      </BlurFade>

      {/* Courts */}
      <BlurFade delay={0.15}>
        <div className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
          <CourtsSection clubId={club.id} courts={club.courts ?? []} />
        </div>
      </BlurFade>
    </div>
  );
}
