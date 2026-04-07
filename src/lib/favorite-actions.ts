"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(clubId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not_authenticated" };
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorite_clubs")
    .select("id")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .single();

  if (existing) {
    await supabase.from("favorite_clubs").delete().eq("id", existing.id);
    return { favorited: false };
  } else {
    await supabase
      .from("favorite_clubs")
      .insert({ user_id: user.id, club_id: clubId });
    return { favorited: true };
  }
}
