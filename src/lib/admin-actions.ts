"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/[đ]/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createClub(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const { data, error } = await supabase
    .from("clubs")
    .insert({
      name,
      slug: slugify(name) + "-" + Date.now().toString(36),
      description: (formData.get("description") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      website: (formData.get("website") as string) || null,
      address_street: formData.get("address_street") as string,
      address_city: formData.get("address_city") as string,
      address_postal_code: (formData.get("address_postal_code") as string) || null,
      latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
      longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
      is_published: formData.get("is_published") === "true",
      owner_id: (formData.get("owner_id") as string) || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Save working hours
  await saveWorkingHours(supabase, data.id, formData);

  // Save amenities
  await saveAmenities(supabase, data.id, formData);

  redirect(`/admin/clubs/${data.id}/edit`);
}

export async function updateClub(clubId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clubs")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      website: (formData.get("website") as string) || null,
      address_street: formData.get("address_street") as string,
      address_city: formData.get("address_city") as string,
      address_postal_code: (formData.get("address_postal_code") as string) || null,
      latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
      longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
      is_published: formData.get("is_published") === "true",
    })
    .eq("id", clubId);

  if (error) return { error: error.message };

  await saveWorkingHours(supabase, clubId, formData);
  await saveAmenities(supabase, clubId, formData);

  return { success: true };
}

export async function assignOwner(clubId: string, ownerId: string | null) {
  const supabase = await createClient();

  // Get current owner
  const { data: club } = await supabase
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .single();

  const previousOwnerId = club?.owner_id;

  // Update club owner
  const { error } = await supabase
    .from("clubs")
    .update({ owner_id: ownerId })
    .eq("id", clubId);

  if (error) return { error: error.message };

  // If new owner set, make them club_owner
  if (ownerId) {
    await supabase
      .from("profiles")
      .update({ role: "club_owner" })
      .eq("id", ownerId);
  }

  // If previous owner removed, check if they still own any clubs
  if (previousOwnerId && previousOwnerId !== ownerId) {
    const { count } = await supabase
      .from("clubs")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", previousOwnerId);

    if (count === 0) {
      await supabase
        .from("profiles")
        .update({ role: "player" })
        .eq("id", previousOwnerId)
        .neq("role", "admin");
    }
  }

  return { success: true };
}

export async function saveCourt(formData: FormData) {
  const supabase = await createClient();
  const courtId = formData.get("courtId") as string;
  const clubId = formData.get("clubId") as string;

  const courtData = {
    club_id: clubId,
    name: formData.get("courtName") as string,
    sport_type: formData.get("sport_type") as Database["public"]["Enums"]["sport_type"],
    surface_type: (formData.get("surface_type") as Database["public"]["Enums"]["surface_type"]) || null,
    is_indoor: formData.get("is_indoor") === "true",
    max_players: formData.get("max_players") ? parseInt(formData.get("max_players") as string) : null,
    price_per_hour: parseFloat(formData.get("price_per_hour") as string),
    is_active: formData.get("is_active") !== "false",
  };

  if (courtId) {
    const { error } = await supabase.from("courts").update(courtData).eq("id", courtId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("courts").insert(courtData);
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function savePricingRule(formData: FormData) {
  const supabase = await createClient();
  const ruleId = formData.get("ruleId") as string;

  const ruleData = {
    court_id: formData.get("courtId") as string,
    day_of_week: formData.get("day_of_week") ? parseInt(formData.get("day_of_week") as string) : null,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    price_per_hour: parseFloat(formData.get("price_per_hour") as string),
  };

  if (ruleId) {
    const { error } = await supabase.from("court_pricing_rules").update(ruleData).eq("id", ruleId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("court_pricing_rules").insert(ruleData);
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function deletePricingRule(ruleId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("court_pricing_rules").delete().eq("id", ruleId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateUserRole(userId: string, role: "player" | "club_owner" | "admin") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { success: true };
}

// Helpers
async function saveWorkingHours(supabase: Awaited<ReturnType<typeof createClient>>, clubId: string, formData: FormData) {
  await supabase.from("working_hours").delete().eq("club_id", clubId);

  const hours = [];
  for (let day = 0; day <= 6; day++) {
    const isClosed = formData.get(`wh_closed_${day}`) === "true";
    const openTime = formData.get(`wh_open_${day}`) as string;
    const closeTime = formData.get(`wh_close_${day}`) as string;

    if (openTime && closeTime) {
      hours.push({
        club_id: clubId,
        day_of_week: day,
        open_time: openTime,
        close_time: closeTime,
        is_closed: isClosed,
      });
    }
  }

  if (hours.length > 0) {
    await supabase.from("working_hours").insert(hours);
  }
}

async function saveAmenities(supabase: Awaited<ReturnType<typeof createClient>>, clubId: string, formData: FormData) {
  await supabase.from("club_amenities").delete().eq("club_id", clubId);

  const amenities = formData.getAll("amenities") as string[];
  if (amenities.length > 0) {
    await supabase.from("club_amenities").insert(
      amenities.map((amenity) => ({ club_id: clubId, amenity: amenity as Database["public"]["Enums"]["amenity_type"] }))
    );
  }
}
