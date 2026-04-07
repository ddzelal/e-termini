import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { BookingsTable } from "./bookings-table";

interface BookingsPageProps {
  searchParams: Promise<{ date_from?: string; date_to?: string; status?: string }>;
}

export default async function DashboardBookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const { clubs } = await getOwnerClubs();
  const supabase = await createClient();
  const clubIds = clubs.map((c) => c.id);

  // Also fetch courts for manual booking form
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
      status, payment_status, booked_by, guest_name, guest_phone, notes,
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Rezervacije</h1>
      <BookingsTable
        bookings={bookings ?? []}
        clubs={clubs}
        courts={courts ?? []}
      />
    </div>
  );
}
