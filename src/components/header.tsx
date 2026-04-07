import { createClient } from "@/lib/supabase/server";
import { HeaderClient } from "./header-client";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <HeaderClient
      user={user ? { id: user.id } : null}
      profile={profile}
    />
  );
}
