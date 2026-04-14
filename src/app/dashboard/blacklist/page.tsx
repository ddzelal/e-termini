import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { BlurFade } from "@/components/ui/blur-fade";
import { BlacklistTable } from "./blacklist-table";

export default async function DashboardBlacklistPage() {
  const { clubs } = await getOwnerClubs();
  const clubIds = clubs.map((c) => c.id);

  // If owner has no clubs, show empty state
  if (clubIds.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <BlurFade>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Blokirani korisnici</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nemate dodeljene klubove.
            </p>
          </div>
        </BlurFade>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: blacklisted, error } = await supabase
    .from("club_blacklist")
    .select(`
      id,
      club_id,
      user_id,
      reason,
      created_at,
      profiles!club_blacklist_user_id_fkey (
        full_name,
        phone
      ),
      clubs (
        name
      )
    `)
    .in("club_id", clubIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Blacklist query error:", error);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blokirani korisnici</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upravljaj listom blokiranih korisnika za tvoje klubove
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.05}>
        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Greška pri učitavanju: {error.message}
            </p>
          </div>
        ) : (
          <BlacklistTable entries={blacklisted ?? []} clubs={clubs} />
        )}
      </BlurFade>
    </div>
  );
}
