import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { sr } from "date-fns/locale";
import { CalendarDays, DollarSign, TrendingUp, Clock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOwnerClubs } from "@/lib/dashboard-helpers";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";

export default async function DashboardPage() {
  const { clubs } = await getOwnerClubs();
  const supabase = await createClient();

  const clubIds = clubs.map((c) => c.id);
  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { count: todayCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("club_id", clubIds)
    .eq("date", today)
    .neq("status", "cancelled");

  const { count: weekCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("club_id", clubIds)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .neq("status", "cancelled");

  const { data: revenueData } = await supabase
    .from("bookings")
    .select("total_price")
    .in("club_id", clubIds)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .eq("payment_status", "paid");

  const monthRevenue = revenueData?.reduce((sum, b) => sum + b.total_price, 0) ?? 0;

  const { data: todayBookings } = await supabase
    .from("bookings")
    .select(`
      id, date, start_time, end_time, total_price, status, payment_status,
      guest_name,
      clubs(name),
      courts(name, sport_type),
      profiles(full_name, phone)
    `)
    .in("club_id", clubIds)
    .eq("date", today)
    .neq("status", "cancelled")
    .order("start_time");

  const stats = [
    { label: "Danas", value: todayCount ?? 0, icon: CalendarDays, color: "text-primary bg-primary/10" },
    { label: "Ova nedelja", value: weekCount ?? 0, icon: TrendingUp, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" },
    { label: "Prihod (mesec)", value: `${monthRevenue.toLocaleString()} RSD`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pregled</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d. MMMM yyyy", { locale: sr })}
          </p>
        </div>
      </BlurFade>

      {/* Stats */}
      <BlurFade delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/50 p-5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>
      </BlurFade>

      {/* Today's bookings */}
      <BlurFade delay={0.1}>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Današnje rezervacije</h2>
            {todayBookings && todayBookings.length > 0 && (
              <span className="flex h-6 items-center rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary">
                {todayBookings.length}
              </span>
            )}
          </div>
          {todayBookings && todayBookings.length > 0 ? (
            <div className="space-y-2">
              {todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-4 rounded-2xl border border-border/50 p-4 transition-colors hover:bg-muted/20 dark:border-white/10"
                >
                  {/* Time block */}
                  <div className="flex h-12 w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/8">
                    <span className="text-sm font-bold text-primary">
                      {b.start_time.slice(0, 5)}
                    </span>
                    <span className="text-[10px] text-primary/70">
                      {b.end_time.slice(0, 5)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{b.courts?.name}</span>
                      {clubs.length > 1 && b.clubs?.name && (
                        <span className="text-xs text-muted-foreground">· {b.clubs.name}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {b.guest_name || b.profiles?.full_name || "Nepoznat"}
                      </span>
                      {b.profiles?.phone && (
                        <span className="hidden sm:inline">· {b.profiles.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Price & status */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant={b.payment_status === "paid" ? "default" : "outline"}
                      className="hidden sm:flex"
                    >
                      {b.payment_status === "paid" ? "Plaćeno" : "Čeka"}
                    </Badge>
                    <span className="text-sm font-bold">
                      {b.total_price.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">RSD</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed py-12 text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="font-medium">Nema rezervacija za danas</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Rezervacije za danas će se pojaviti ovde
              </p>
            </div>
          )}
        </section>
      </BlurFade>
    </div>
  );
}
