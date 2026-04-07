"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Calendar, Building2, ArrowLeft } from "lucide-react";

interface DashboardNavProps {
  role: string;
  fullName: string;
}

const navItems = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Rezervacije", icon: CalendarDays },
  { href: "/dashboard/schedule", label: "Raspored", icon: Calendar },
  { href: "/dashboard/club", label: "Moj klub", icon: Building2 },
];

export function DashboardNav({ role, fullName }: DashboardNavProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 shrink-0 flex-col border-r border-border/40 bg-muted/20 dark:bg-white/[0.02]">
        <div className="p-5 pb-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Nazad na sajt
          </Link>
          <div>
            <h2 className="text-sm font-bold">Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{fullName}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 text-[10px] text-muted-foreground/50">
          {role === "admin" ? "Administrator" : "Vlasnik kluba"}
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 backdrop-blur-xl lg:hidden">
        <nav className="mx-auto flex max-w-md">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom padding on mobile so content isn't hidden behind tabs */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
