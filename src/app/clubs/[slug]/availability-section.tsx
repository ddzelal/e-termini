"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isToday, startOfDay } from "date-fns";
import { sr } from "date-fns/locale";
import { Loader2, Check, Calendar, MapPin, Clock, Phone, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SPORT_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { createBooking } from "@/lib/booking-actions";
import { AuthModal } from "@/components/auth-modal";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];
type BookingMode = Database["public"]["Enums"]["booking_mode_type"];

interface Slot {
  court_id: string;
  court_name: string;
  court_sport_type: SportType;
  slot_start_time: string;
  slot_end_time: string;
  slot_duration_minutes: number;
  slot_price: number;
  slot_status: "available" | "booked" | "blocked" | "past";
}

interface AvailabilitySectionProps {
  clubId: string;
  clubName?: string;
  sports: SportType[];
  bookingMode: BookingMode;
  clubPhone?: string | null;
}

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", padel: "🏓",
  volleyball: "🏐", handball: "🤾", futsal: "⚽", other: "🏅",
};

export function AvailabilitySection({
  clubId,
  clubName,
  sports,
  bookingMode,
  clubPhone,
}: AvailabilitySectionProps) {
  const isOwnerOnly = bookingMode === "owner_only";
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<"success" | "error" | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Generate next 7 days for date picker
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, []);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.rpc("get_club_availability", {
        p_club_id: clubId,
        p_date: format(date, "yyyy-MM-dd"),
        p_sport_type: selectedSport || undefined,
      });
      setSlots((data as Slot[]) ?? []);
      setLoading(false);
    }
    fetchAvailability();
  }, [clubId, date, selectedSport]);

  // Group slots by court, then by full hour
  const courts = useMemo(() => {
    const grouped: Record<string, { name: string; sport: SportType; hours: Record<number, Slot[]> }> = {};

    for (const slot of slots) {
      if (!grouped[slot.court_id]) {
        grouped[slot.court_id] = { name: slot.court_name, sport: slot.court_sport_type, hours: {} };
      }
      const hour = parseInt(slot.slot_start_time.split(":")[0]);
      if (!grouped[slot.court_id].hours[hour]) {
        grouped[slot.court_id].hours[hour] = [];
      }
      grouped[slot.court_id].hours[hour].push(slot);
    }

    return grouped;
  }, [slots]);

  // Get all unique hours across all courts
  const allHours = useMemo(() => {
    const hourSet = new Set<number>();
    for (const court of Object.values(courts)) {
      for (const h of Object.keys(court.hours)) {
        hourSet.add(parseInt(h));
      }
    }
    return [...hourSet].sort((a, b) => a - b);
  }, [courts]);

  // An hour is "past everywhere" if every court treats it as past
  const pastHoursCount = useMemo(() => {
    let count = 0;
    for (const hour of allHours) {
      const allPast = Object.keys(courts).every((courtId) => {
        const slots = courts[courtId]?.hours[hour];
        return slots && slots.length > 0 && slots.every((s) => s.slot_status === "past");
      });
      if (allPast) count++;
    }
    return count;
  }, [allHours, courts]);

  // Hours visible after the "show past" toggle
  const visibleHours = useMemo(() => {
    if (showPast) return allHours;
    return allHours.filter((hour) => {
      // Keep the hour if at least one court has a non-past slot for it
      return Object.keys(courts).some((courtId) => {
        const slots = courts[courtId]?.hours[hour];
        return slots?.some((s) => s.slot_status !== "past");
      });
    });
  }, [allHours, courts, showPast]);

  // Get hour status: check all slots within that hour
  function getHourStatus(
    courtId: string,
    hour: number
  ): "available" | "booked" | "blocked" | "past" | "partial" {
    const hourSlots = courts[courtId]?.hours[hour];
    if (!hourSlots || hourSlots.length === 0) return "blocked";

    const statuses = hourSlots.map((s) => s.slot_status);
    if (statuses.every((s) => s === "past")) return "past";
    if (statuses.every((s) => s === "booked")) return "booked";
    if (statuses.every((s) => s === "blocked")) return "blocked";
    if (statuses.every((s) => s === "available")) return "available";
    // Mix — if any available, show as partial; otherwise treat as past > booked > blocked
    if (statuses.some((s) => s === "available")) return "partial";
    if (statuses.some((s) => s === "past")) return "past";
    return "booked";
  }

  // Get first available slot for a given hour
  function getAvailableSlot(courtId: string, hour: number): Slot | null {
    const hourSlots = courts[courtId]?.hours[hour];
    return hourSlots?.find((s) => s.slot_status === "available") ?? null;
  }

  // Get price for hour (first slot's price)
  function getHourPrice(courtId: string, hour: number): number | null {
    const hourSlots = courts[courtId]?.hours[hour];
    const available = hourSlots?.find((s) => s.slot_status === "available");
    return available?.slot_price ?? null;
  }

  async function handleSlotClick(slot: Slot) {
    if (isOwnerOnly) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSelectedSlot(slot);
      setAuthOpen(true);
      return;
    }
    setSelectedSlot(slot);
    setBookingResult(null);
    setBookingError(null);
    setConfirmOpen(true);
  }

  function handleAuthSuccess() {
    setAuthOpen(false);
    if (selectedSlot) {
      setBookingResult(null);
      setBookingError(null);
      setConfirmOpen(true);
    }
  }

  async function handleConfirmBooking() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookingError(null);

    const result = await createBooking({
      courtId: selectedSlot.court_id,
      clubId,
      date: format(date, "yyyy-MM-dd"),
      startTime: selectedSlot.slot_start_time,
      endTime: selectedSlot.slot_end_time,
      durationMinutes: selectedSlot.slot_duration_minutes,
      totalPrice: selectedSlot.slot_price,
    });

    setBooking(false);

    if (result.error) {
      setBookingError(result.error);
      setBookingResult("error");
    } else {
      setBookingResult("success");
      const end = Date.now() + 500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      const supabase = createClient();
      const { data } = await supabase.rpc("get_club_availability", {
        p_club_id: clubId,
        p_date: format(date, "yyyy-MM-dd"),
        p_sport_type: selectedSport || undefined,
      });
      setSlots((data as Slot[]) ?? []);
    }
  }

  return (
    <>
      <section>
        <h2 className="mb-5 text-lg font-semibold">Dostupni termini</h2>

        {/* Date picker — horizontal scroll of 7 days */}
        <div className="mb-5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day) => {
            const selected = format(day, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setDate(day)}
                className={`flex flex-col items-center rounded-xl border py-2 sm:py-2.5 text-center transition-all ${
                  selected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border/50 hover:border-border hover:bg-muted/50 dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider ${selected ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                  {today ? "Danas" : format(day, "EEEEE", { locale: sr })}
                </span>
                <span className={`text-base sm:text-lg font-bold leading-tight ${selected ? "" : "text-foreground"}`}>
                  {format(day, "d")}
                </span>
                <span className={`text-[10px] sm:text-[11px] ${selected ? "text-primary" : "text-muted-foreground"} hidden sm:block`}>
                  {format(day, "MMM", { locale: sr })}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sport filter tabs */}
        {sports.length > 1 && (
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedSport(undefined)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                !selectedSport
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:border-white/10"
              }`}
            >
              Svi
            </button>
            {sports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(selectedSport === sport ? undefined : sport)}
                className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  selectedSport === sport
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:border-white/10"
                }`}
              >
                <span className="text-sm leading-none">{SPORT_ICONS[sport]}</span>
                {SPORT_LABELS[sport]}
              </button>
            ))}
          </div>
        )}

        {/* Owner-only booking notice */}
        {isOwnerOnly && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Rezervacije telefonom</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Ovaj klub prima rezervacije pozivom. Pogledajte dostupnost i pozovite klub za potvrdu termina.
              </p>
            </div>
            {clubPhone && (
              <a
                href={`tel:${clubPhone}`}
                className={buttonVariants({ size: "sm", className: "shrink-0" })}
              >
                Pozovi
              </a>
            )}
          </div>
        )}

        {/* Timeline grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(courts).length === 0 ? (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="font-medium">Nema termina za ovaj dan</p>
            <p className="mt-1 text-sm text-muted-foreground">Probaj drugi datum</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Legend + show past toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-6 rounded-sm border border-primary/30 bg-primary/10" />
                  Slobodno
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-6 rounded-sm border border-red-200 bg-red-100 dark:border-red-900/30 dark:bg-red-950/30" />
                  Zauzeto
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-6 rounded-sm bg-muted border border-border/50" />
                  Blokirano
                </div>
                {showPast && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-6 rounded-sm border border-dashed border-border/60 bg-muted/20" />
                    Prošlo
                  </div>
                )}
              </div>

              {pastHoursCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPast((v) => !v)}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground dark:border-white/10"
                >
                  {showPast ? (
                    <>
                      <EyeOff className="h-3 w-3" />
                      Sakrij prošle ({pastHoursCount})
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Prikaži prošle ({pastHoursCount})
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Per court timeline */}
            <AnimatePresence mode="wait">
              <motion.div
                key={format(date, "yyyy-MM-dd") + (selectedSport ?? "")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {Object.entries(courts).map(([courtId, court]) => (
                  <div key={courtId} className="rounded-2xl border border-border/50 p-3 sm:p-4 dark:border-white/10">
                    <div className="mb-2.5 sm:mb-3 flex items-center gap-2">
                      <span className="text-sm leading-none">{SPORT_ICONS[court.sport]}</span>
                      <h3 className="font-semibold text-sm">{court.name}</h3>
                    </div>

                    {visibleHours.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Svi termini za danas su prošli.{" "}
                        <button
                          type="button"
                          onClick={() => setShowPast(true)}
                          className="text-primary hover:underline"
                        >
                          Prikaži ih
                        </button>
                      </p>
                    )}

                    {/* Desktop: wrapping grid (8 cols on sm, 12 on md+) */}
                    <div className="hidden sm:grid sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                      {visibleHours.map((hour) => {
                        const status = getHourStatus(courtId, hour);
                        const price = getHourPrice(courtId, hour);
                        const slot = getAvailableSlot(courtId, hour);
                        const isAvailable = status === "available" || status === "partial";
                        const isBooked = status === "booked";
                        const isPast = status === "past";
                        const isClickable = isAvailable && !isOwnerOnly;
                        const title = isPast
                          ? "Prošlo vreme"
                          : isOwnerOnly && isAvailable
                            ? "Rezervacija telefonom"
                            : undefined;

                        return (
                          <button
                            key={hour}
                            disabled={!isClickable}
                            onClick={() => slot && handleSlotClick(slot)}
                            title={title}
                            className={`group relative flex flex-col items-center rounded-xl py-2.5 px-1 text-center transition-all ${
                              isClickable
                                ? "border border-primary/20 bg-primary/[0.06] hover:bg-primary/15 hover:border-primary/40 hover:shadow-sm cursor-pointer active:scale-95"
                                : isAvailable
                                  ? "border border-primary/20 bg-primary/[0.06] cursor-not-allowed opacity-80"
                                  : isBooked
                                    ? "border border-red-200/60 bg-red-50/80 dark:border-red-900/20 dark:bg-red-950/20 cursor-not-allowed"
                                    : isPast
                                      ? "border border-dashed border-border/50 bg-muted/20 cursor-not-allowed"
                                      : "border border-border/30 bg-muted/30 cursor-not-allowed"
                            }`}
                          >
                            <span className={`text-xs font-medium ${
                              isAvailable
                                ? "text-foreground"
                                : isBooked
                                  ? "text-red-400 dark:text-red-500/60"
                                  : isPast
                                    ? "text-muted-foreground/40 line-through decoration-1"
                                    : "text-muted-foreground/50"
                            }`}>
                              {hour}:00
                            </span>
                            {isAvailable && price ? (
                              <span className="mt-0.5 text-[10px] text-primary font-medium">
                                {(price / 1000).toFixed(0)}k
                              </span>
                            ) : isBooked ? (
                              <span className="mt-0.5 text-[10px] text-red-400 dark:text-red-500/50">●</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile: compact grid */}
                    <div className="sm:hidden grid grid-cols-5 gap-1">
                      {visibleHours.map((hour) => {
                        const status = getHourStatus(courtId, hour);
                        const price = getHourPrice(courtId, hour);
                        const slot = getAvailableSlot(courtId, hour);
                        const isAvailable = status === "available" || status === "partial";
                        const isBooked = status === "booked";
                        const isPast = status === "past";
                        const isClickable = isAvailable && !isOwnerOnly;
                        const title = isPast
                          ? "Prošlo vreme"
                          : isOwnerOnly && isAvailable
                            ? "Rezervacija telefonom"
                            : undefined;

                        return (
                          <button
                            key={hour}
                            disabled={!isClickable}
                            onClick={() => slot && handleSlotClick(slot)}
                            title={title}
                            className={`flex flex-col items-center rounded-lg py-1.5 transition-all ${
                              isClickable
                                ? "border border-primary/20 bg-primary/[0.06] active:scale-95"
                                : isAvailable
                                  ? "border border-primary/20 bg-primary/[0.06] opacity-80"
                                  : isBooked
                                    ? "border border-red-200/60 bg-red-50/80 dark:border-red-900/20 dark:bg-red-950/20"
                                    : isPast
                                      ? "border border-dashed border-border/50 bg-muted/20"
                                      : "border border-border/30 bg-muted/30"
                            }`}
                          >
                            <span className={`text-[11px] font-semibold ${
                              isAvailable
                                ? "text-foreground"
                                : isBooked
                                  ? "text-red-400"
                                  : isPast
                                    ? "text-muted-foreground/40 line-through decoration-1"
                                    : "text-muted-foreground/50"
                            }`}>
                              {hour}:00
                            </span>
                            {isAvailable && price ? (
                              <span className="text-[9px] text-primary font-medium">
                                {(price / 1000).toFixed(0)}k
                              </span>
                            ) : isBooked ? (
                              <span className="text-[9px] text-red-400">●</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (!open && selectedSlot) {
            const supabase = createClient();
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) handleAuthSuccess();
            });
          }
        }}
      />

      {/* Booking confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {bookingResult === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-4 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Termin rezervisan!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Plaćanje se vrši na licu mesta u klubu.
                  </p>
                </div>
                <div className="w-full rounded-xl border border-border/50 p-4 text-sm space-y-2 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">
                      {format(date, "EEEE, d. MMMM yyyy", { locale: sr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedSlot?.slot_start_time.slice(0, 5)} - {selectedSlot?.slot_end_time.slice(0, 5)}
                    </span>
                  </div>
                  <div className="font-medium">{selectedSlot?.court_name}</div>
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => { setConfirmOpen(false); router.push("/bookings"); }}
                  >
                    Moje rezervacije
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
                    Zatvori
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DialogHeader>
                  <DialogTitle>Potvrda rezervacije</DialogTitle>
                  <DialogDescription>Proverite detalje pre potvrde</DialogDescription>
                </DialogHeader>

                {selectedSlot && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-border/50 p-4 space-y-3 dark:border-white/10">
                      {clubName && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{clubName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">
                          {format(date, "EEEE, d. MMMM yyyy", { locale: sr })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Teren</span>
                        <span className="font-medium">{selectedSlot.court_name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vreme</span>
                        <span className="font-medium">
                          {selectedSlot.slot_start_time.slice(0, 5)} - {selectedSlot.slot_end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Trajanje</span>
                        <span className="font-medium">{selectedSlot.slot_duration_minutes} min</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-medium">Ukupno</span>
                        <span className="text-lg font-bold">
                          {selectedSlot.slot_price.toLocaleString()} RSD
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Plaćanje se vrši na licu mesta u klubu
                    </p>

                    {bookingError && (
                      <p className="text-sm text-destructive text-center">{bookingError}</p>
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1" onClick={handleConfirmBooking} disabled={booking}>
                        {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Potvrdi rezervaciju
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={booking}>
                        Otkaži
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
