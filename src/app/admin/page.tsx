import Link from "next/link";
import { Building2, Users, CalendarDays, Layers, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BlurFade } from "@/components/ui/blur-fade";

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
    { label: "Klubovi", value: clubCount ?? 0, icon: Building2, href: "/admin/clubs", color: "text-primary bg-primary/10" },
    { label: "Tereni", value: courtCount ?? 0, icon: Layers, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30" },
    { label: "Rezervacije", value: bookingCount ?? 0, icon: CalendarDays, color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30" },
    { label: "Korisnici", value: userCount ?? 0, icon: Users, href: "/admin/users", color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <BlurFade>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pregled i upravljanje platformom
          </p>
        </div>
      </BlurFade>

      <BlurFade delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const content = (
              <div className="rounded-2xl border border-border/50 p-5 transition-all hover:shadow-sm dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold">{stat.value}</div>
                {stat.href && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    Pogledaj <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
            return stat.href ? (
              <Link key={stat.label} href={stat.href}>{content}</Link>
            ) : (
              <div key={stat.label}>{content}</div>
            );
          })}
        </div>
      </BlurFade>

      {/* Quick links */}
      <BlurFade delay={0.1}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/clubs/new"
            className="flex items-center gap-3 rounded-2xl border border-border/50 p-4 transition-all hover:border-primary/20 hover:bg-primary/[0.02] hover:shadow-sm dark:border-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Kreiraj novi klub</p>
              <p className="text-xs text-muted-foreground">Dodaj lokaciju na platformu</p>
            </div>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl border border-border/50 p-4 transition-all hover:border-primary/20 hover:bg-primary/[0.02] hover:shadow-sm dark:border-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Otvori Dashboard</p>
              <p className="text-xs text-muted-foreground">Upravljaj rezervacijama</p>
            </div>
          </Link>
        </div>
      </BlurFade>
    </div>
  );
}
