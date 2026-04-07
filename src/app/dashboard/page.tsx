import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { CalendarDays, DollarSign, TrendingUp, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { clubs } = await getOwnerClubs();
  const supabase = await createClient();

  const clubIds = clubs.map((c) => c.id);
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // Today's bookings count
  const { count: todayCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("club_id", clubIds)
    .eq("date", today)
    .neq("status", "cancelled");

  // This week's bookings count
  const { count: weekCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("club_id", clubIds)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .neq("status", "cancelled");

  // This month's revenue (paid)
  const { data: revenueData } = await supabase
    .from("bookings")
    .select("total_price")
    .in("club_id", clubIds)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .eq("payment_status", "paid");

  const monthRevenue = revenueData?.reduce((sum, b) => sum + b.total_price, 0) ?? 0;

  // Today's bookings list
  const { data: todayBookings } = await supabase
    .from("bookings")
    .select(`
      id, date, start_time, end_time, total_price, status, payment_status,
      guest_name,
      clubs(name),
      courts(name),
      profiles(full_name, phone)
    `)
    .in("club_id", clubIds)
    .eq("date", today)
    .neq("status", "cancelled")
    .order("start_time");

  const stats = [
    { label: "Danas", value: todayCount ?? 0, icon: CalendarDays },
    { label: "Ova nedelja", value: weekCount ?? 0, icon: TrendingUp },
    { label: "Prihod (mesec)", value: `${monthRevenue.toLocaleString()} RSD`, icon: DollarSign },
    { label: "Klubovi", value: clubs.length, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <stat.icon className="h-4 w-4" />
              {stat.label}
            </div>
            <div className="mt-1 text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Today's bookings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Današnje rezervacije</h2>
        {todayBookings && todayBookings.length > 0 ? (
          <div className="space-y-2">
            {todayBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {b.courts?.name}
                    </span>
                    {clubs.length > 1 && b.clubs?.name && (
                      <Badge variant="outline" className="text-xs">{b.clubs.name}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {b.guest_name || b.profiles?.full_name || "Nepoznat"}
                    {(b.profiles?.phone) && ` · ${b.profiles.phone}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={b.payment_status === "paid" ? "default" : "secondary"}
                  >
                    {b.payment_status === "paid" ? "Plaćeno" : "Čeka plaćanje"}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {b.total_price.toLocaleString()} RSD
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground">Nema rezervacija za danas</p>
          </div>
        )}
      </section>
    </div>
  );
}
