import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <AdminNav fullName={profile.full_name} />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
