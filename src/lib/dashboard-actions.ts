"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateBookingStatus(
  bookingId: string,
  status: "confirmed" | "cancelled" | "completed" | "no_show"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status,
      ...(status === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
    })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: "pending" | "paid"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ payment_status: paymentStatus })
    .eq("id", bookingId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function createManualBooking(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const bookedBy = profile?.role === "admin" ? "admin" : "club_owner";

  const courtId = formData.get("courtId") as string;
  const clubId = formData.get("clubId") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const guestName = formData.get("guestName") as string;
  const guestPhone = formData.get("guestPhone") as string;
  const price = parseFloat(formData.get("price") as string) || 0;

  const startH = parseInt(startTime.split(":")[0]);
  const startM = parseInt(startTime.split(":")[1]);
  const endH = parseInt(endTime.split(":")[0]);
  const endM = parseInt(endTime.split(":")[1]);
  const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  if (durationMinutes <= 0) return { error: "Neispravan vremenski raspon." };

  const { error } = await supabase.from("bookings").insert({
    court_id: courtId,
    club_id: clubId,
    date,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: durationMinutes,
    total_price: price,
    booked_by: bookedBy,
    guest_name: guestName || null,
    guest_phone: guestPhone || null,
    status: "confirmed",
    payment_status: "pending",
  });

  if (error) {
    if (error.code === "23P01") return { error: "Termin se preklapa sa postojećom rezervacijom." };
    return { error: error.message };
  }

  return { success: true };
}

export async function createBlockedSlot(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const { error } = await supabase.from("blocked_slots").insert({
    court_id: formData.get("courtId") as string,
    date: formData.get("date") as string,
    start_time: formData.get("startTime") as string,
    end_time: formData.get("endTime") as string,
    reason: (formData.get("reason") as string) || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  return { success: true };
}

interface AffectedBooking {
  booking_id: string;
  date: string;
  start_time: string;
  end_time: string;
  player_name: string | null;
  player_phone: string | null;
  total_price: number;
}

export async function createCourtClosure(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niste prijavljeni." };

  const courtId = formData.get("courtId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const reason = ((formData.get("reason") as string) ?? "").trim();
  const notify = formData.get("notify") === "true";

  if (!courtId || !startDate || !endDate) {
    return { error: "Obavezna polja nedostaju." };
  }
  if (!reason) return { error: "Razlog je obavezan." };

  const { data, error } = await supabase.rpc("create_court_closure", {
    p_court_id: courtId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_reason: reason,
    p_notify: notify,
  });

  if (error) return { error: error.message };

  const payload = data as unknown as {
    closure_id: string;
    affected_count: number;
    affected_bookings: AffectedBooking[];
  };

  return {
    success: true,
    closureId: payload.closure_id,
    affectedCount: payload.affected_count,
    affected: payload.affected_bookings ?? [],
  };
}

export async function listCourtClosures(courtId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("court_closures")
    .select("*")
    .eq("court_id", courtId)
    .order("start_date", { ascending: false });
  if (error) return { error: error.message };
  return { closures: data ?? [] };
}

export async function deleteCourtClosure(closureId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("court_closures")
    .delete()
    .eq("id", closureId);
  if (error) return { error: error.message };
  return { success: true };
}
