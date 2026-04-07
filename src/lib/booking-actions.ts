"use server";

import { createClient } from "@/lib/supabase/server";

interface CreateBookingParams {
  courtId: string;
  clubId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalPrice: number;
}

export async function createBooking(params: CreateBookingParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Morate biti prijavljeni da biste rezervisali termin." };
  }

  // Double-check availability before booking
  const { data: conflicts } = await supabase
    .from("bookings")
    .select("id")
    .eq("court_id", params.courtId)
    .eq("date", params.date)
    .neq("status", "cancelled")
    .lt("start_time", params.endTime)
    .gt("end_time", params.startTime)
    .limit(1);

  if (conflicts && conflicts.length > 0) {
    return { error: "Ovaj termin je u međuvremenu zauzet. Osvežite stranicu." };
  }

  // Check blocked slots
  const { data: blocked } = await supabase
    .from("blocked_slots")
    .select("id")
    .eq("court_id", params.courtId)
    .eq("date", params.date)
    .lt("start_time", params.endTime)
    .gt("end_time", params.startTime)
    .limit(1);

  if (blocked && blocked.length > 0) {
    return { error: "Ovaj termin je blokiran." };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      court_id: params.courtId,
      club_id: params.clubId,
      user_id: user.id,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      duration_minutes: params.durationMinutes,
      total_price: params.totalPrice,
      booked_by: "player",
      status: "confirmed",
      payment_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Booking insert error:", error.code, error.message);
    if (error.code === "23P01") {
      return { error: "Ovaj termin je u međuvremenu zauzet. Osvežite stranicu." };
    }
    if (error.code === "23503") {
      return { error: "Greška sa korisničkim nalogom. Pokušajte da se ponovo prijavite." };
    }
    return { error: `Greška pri kreiranju rezervacije: ${error.message}` };
  }

  return { success: true, bookingId: data.id };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Morate biti prijavljeni." };
  }

  // Get booking and check ownership + time
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, date, start_time, status")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { error: "Rezervacija nije pronađena." };
  }

  if (booking.user_id !== user.id) {
    return { error: "Nemate dozvolu za otkazivanje ove rezervacije." };
  }

  if (booking.status === "cancelled") {
    return { error: "Rezervacija je već otkazana." };
  }

  // Check 2-hour cancellation window
  const bookingDateTime = new Date(`${booking.date}T${booking.start_time}`);
  const now = new Date();
  const hoursUntil = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntil < 2) {
    return { error: "Otkazivanje je moguće najkasnije 2 sata pre početka termina." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    return { error: "Greška pri otkazivanju. Pokušajte ponovo." };
  }

  return { success: true };
}
