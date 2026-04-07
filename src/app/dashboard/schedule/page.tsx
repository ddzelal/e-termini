import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { WeeklySchedule } from "./weekly-schedule";

export default async function SchedulePage() {
  const { clubs } = await getOwnerClubs();
  const supabase = await createClient();
  const clubIds = clubs.map((c) => c.id);

  const { data: courts } = await supabase
    .from("courts")
    .select("id, name, club_id, sport_type")
    .in("club_id", clubIds)
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nedeljni raspored</h1>
      <WeeklySchedule
        clubs={clubs}
        courts={courts ?? []}
      />
    </div>
  );
}
