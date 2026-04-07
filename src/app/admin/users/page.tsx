import { createClient } from "@/lib/supabase/server";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Korisnici</h1>
      <UsersTable users={users ?? []} />
    </div>
  );
}
