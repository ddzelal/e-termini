import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, CalendarDays, Calendar, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "club_owner" && profile.role !== "admin")) {
    redirect("/");
  }

  const navItems = [
    { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
    { href: "/dashboard/bookings", label: "Rezervacije", icon: CalendarDays },
    { href: "/dashboard/schedule", label: "Raspored", icon: Calendar },
    { href: "/dashboard/club", label: "Moj klub", icon: Building2 },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <aside className="border-b md:border-b-0 md:border-r md:w-56 shrink-0">
        <nav className="flex md:flex-col gap-1 p-2 overflow-x-auto md:overflow-visible">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "justify-start gap-2 whitespace-nowrap",
              })}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
