import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getOwnerClubs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/");

  let clubsQuery = supabase
    .from("clubs")
    .select("id, name, slug")
    .order("name");

  // Admin sees all clubs, club_owner only their own
  if (profile.role === "club_owner") {
    clubsQuery = clubsQuery.eq("owner_id", user.id);
  }

  const { data: clubs } = await clubsQuery;
  return { clubs: clubs ?? [], userId: user.id, role: profile.role };
}
