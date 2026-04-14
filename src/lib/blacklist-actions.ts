"use server";

import { createClient } from "@/lib/supabase/server";

export async function addToBlacklist(clubId: string, userId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { error } = await supabase.from("club_blacklist").insert({
    club_id: clubId,
    user_id: userId,
    reason: reason || null,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Korisnik je već na crnoj listi ovog kluba." };
    return { error: error.message };
  }

  // Cancel all future confirmed bookings for this user in this club
  const today = new Date().toISOString().split("T")[0];
  const { data: cancelled, error: cancelError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled" as const,
      cancelled_at: new Date().toISOString(),
    })
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", today)
    .select("id");

  if (cancelError) {
    console.error("Failed to cancel bookings on blacklist:", cancelError);
  }

  const cancelledCount = cancelled?.length ?? 0;

  return { success: true, cancelledCount };
}

export async function removeFromBlacklist(clubId: string, userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { error } = await supabase
    .from("club_blacklist")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function getClubBlacklist(clubId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("club_blacklist")
    .select(`
      id,
      reason,
      created_at,
      user_id,
      profiles!club_blacklist_user_id_fkey (
        full_name,
        phone,
        avatar_url
      )
    `)
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: null };
  return { data };
}

export async function isUserBlacklisted(clubId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("club_blacklist")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .limit(1);

  return (data && data.length > 0) || false;
}

export async function searchUsersForBlacklist(query: string) {
  const supabase = await createClient();

  if (!query || query.length < 2) return { data: [] };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .eq("role", "player")
    .order("full_name")
    .limit(10);

  if (error) return { data: [], error: error.message };
  return { data: data ?? [] };
}

export async function getUserNoShowCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "no_show")
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

  return count ?? 0;
}
