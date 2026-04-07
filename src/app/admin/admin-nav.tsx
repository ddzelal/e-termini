"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, ArrowLeft, Shield } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Pregled", icon: LayoutDashboard, exact: true },
  { href: "/admin/clubs", label: "Klubovi", icon: Building2 },
  { href: "/admin/users", label: "Korisnici", icon: Users },
];

export function AdminNav({ fullName }: { fullName: string }) {
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
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Admin</h2>
              <p className="text-[11px] text-muted-foreground truncate">{fullName}</p>
            </div>
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

        <div className="p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50 dark:border-white/10"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Idi na Dashboard
          </Link>
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
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="h-16 lg:hidden" />
    </>
  );
}
