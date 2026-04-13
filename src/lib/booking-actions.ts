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

interface LocalNow {
  date: string; // YYYY-MM-DD in club timezone
  minutes: number; // minutes since midnight in club timezone
}

function getLocalNow(timezone: string): LocalNow {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10),
  };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export async function createBooking(params: CreateBookingParams) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Morate biti prijavljeni da biste rezervisali termin." };
  }

  // Club booking policy: mode, lead time, max advance window, timezone
  const { data: club } = await supabase
    .from("clubs")
    .select("booking_mode, min_booking_lead_minutes, max_booking_advance_days, phone, timezone")
    .eq("id", params.clubId)
    .single();

  if (!club) {
    return { error: "Klub nije pronađen." };
  }

  if (club.booking_mode === "owner_only") {
    const phoneHint = club.phone ? ` Pozovite: ${club.phone}` : "";
    return {
      error: `Ovaj klub prima rezervacije telefonski.${phoneHint}`,
    };
  }

  const localNow = getLocalNow(club.timezone);
  const slotMinutes = timeToMinutes(params.startTime);

  if (params.date < localNow.date) {
    return { error: "Termin je u prošlosti." };
  }

  if (params.date === localNow.date) {
    const minAllowedMinutes = localNow.minutes + club.min_booking_lead_minutes;
    if (slotMinutes < minAllowedMinutes) {
      return {
        error: `Rezervacija mora biti najmanje ${club.min_booking_lead_minutes} minuta unapred.`,
      };
    }
  }

  const maxAllowedDate = addDaysISO(localNow.date, club.max_booking_advance_days);
  if (params.date > maxAllowedDate) {
    return {
      error: `Rezervacije su moguće najviše ${club.max_booking_advance_days} dana unapred.`,
    };
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
