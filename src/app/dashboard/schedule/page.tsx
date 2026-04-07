import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { BlurFade } from "@/components/ui/blur-fade";
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
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raspored</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nedeljni pregled zauzetosti terena
          </p>
        </div>
      </BlurFade>
      <BlurFade delay={0.05}>
        <WeeklySchedule clubs={clubs} courts={courts ?? []} />
      </BlurFade>
    </div>
  );
}
