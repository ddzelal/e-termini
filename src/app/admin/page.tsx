import { Building2, Users, CalendarDays, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clubCount },
    { count: courtCount },
    { count: bookingCount },
    { count: userCount },
  ] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("courts").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Klubovi", value: clubCount ?? 0, icon: Building2 },
    { label: "Tereni", value: courtCount ?? 0, icon: Layers },
    { label: "Rezervacije", value: bookingCount ?? 0, icon: CalendarDays },
    { label: "Korisnici", value: userCount ?? 0, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
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
    </div>
  );
}
