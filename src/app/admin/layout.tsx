import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard, Building2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminLayout({
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

  if (profile?.role !== "admin") redirect("/");

  const navItems = [
    { href: "/admin", label: "Pregled", icon: LayoutDashboard },
    { href: "/admin/clubs", label: "Klubovi", icon: Building2 },
    { href: "/admin/users", label: "Korisnici", icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <aside className="border-b md:border-b-0 md:border-r md:w-56 shrink-0">
        <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 hidden md:block">
          Admin
        </div>
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
