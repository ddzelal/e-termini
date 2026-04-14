import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { BlurFade } from "@/components/ui/blur-fade";
import { BookingsTable } from "./bookings-table";

interface BookingsPageProps {
  searchParams: Promise<{ date_from?: string; date_to?: string; status?: string }>;
}

export default async function DashboardBookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const { clubs } = await getOwnerClubs();
  const supabase = await createClient();
  const clubIds = clubs.map((c) => c.id);

  const { data: courts } = await supabase
    .from("courts")
    .select("id, name, club_id, sport_type")
    .in("club_id", clubIds)
    .eq("is_active", true)
    .order("name");

  let query = supabase
    .from("bookings")
    .select(`
      id, date, start_time, end_time, duration_minutes, total_price,
      status, payment_status, booked_by, guest_name, guest_phone, notes, user_id,
      clubs(id, name),
      courts(id, name, sport_type),
      profiles(full_name, phone)
    `)
    .in("club_id", clubIds)
    .order("date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(100);

  if (params.date_from) query = query.gte("date", params.date_from);
  if (params.date_to) query = query.lte("date", params.date_to);
  if (params.status) query = query.eq("status", params.status as "confirmed" | "cancelled" | "completed" | "no_show");

  const { data: bookings } = await query;

  // Count no-shows per user in last 30 days for badge display
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const userIds = [...new Set(bookings?.map((b) => b.user_id).filter(Boolean) as string[])];
  const noShowCounts: Record<string, number> = {};
  if (userIds.length > 0) {
    const { data: noShows } = await supabase
      .from("bookings")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "no_show")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);
    noShows?.forEach((ns) => {
      if (ns.user_id) noShowCounts[ns.user_id] = (noShowCounts[ns.user_id] || 0) + 1;
    });
  }
  const enrichedBookings = bookings?.map((b) => ({
    ...b,
    profiles: b.profiles
      ? { ...b.profiles, no_show_count: b.user_id ? noShowCounts[b.user_id] || 0 : 0 }
      : null,
  })) ?? [];

  // Stats
  const confirmed = enrichedBookings.filter((b) => b.status === "confirmed").length;
  const totalRevenue = enrichedBookings.filter((b) => b.payment_status === "paid").reduce((s, b) => s + b.total_price, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BlurFade>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rezervacije</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upravljaj svim rezervacijama tvojih klubova
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Aktivne: </span>
              <span className="font-bold text-primary">{confirmed}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Prihod: </span>
              <span className="font-bold">{totalRevenue.toLocaleString()} RSD</span>
            </div>
          </div>
        </div>
      </BlurFade>

      <BlurFade delay={0.05}>
        <BookingsTable
          bookings={enrichedBookings}
          clubs={clubs}
          courts={courts ?? []}
        />
      </BlurFade>
    </div>
  );
}
