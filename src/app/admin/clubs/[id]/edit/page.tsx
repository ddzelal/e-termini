import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClubForm } from "@/components/admin/club-form";
import { CourtsSection } from "./courts-section";
import { OwnerSection } from "./owner-section";
import { Separator } from "@/components/ui/separator";

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
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Uređivanje: {club.name}
      </h1>

      <ClubForm
        club={club}
        workingHours={workingHours}
        amenities={amenities}
        isAdmin
      />

      <Separator />

      <OwnerSection clubId={club.id} currentOwnerId={club.owner_id} />

      <Separator />

      <CourtsSection clubId={club.id} courts={club.courts ?? []} />
    </div>
  );
}
