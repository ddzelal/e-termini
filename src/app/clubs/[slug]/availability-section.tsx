"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays } from "date-fns";
import { sr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, Check, Calendar, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
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

interface Slot {
  court_id: string;
  court_name: string;
  court_sport_type: SportType;
  slot_start_time: string;
  slot_end_time: string;
  slot_duration_minutes: number;
  slot_price: number;
  slot_status: "available" | "booked" | "blocked";
}

interface AvailabilitySectionProps {
  clubId: string;
  clubName?: string;
  sports: SportType[];
}

export function AvailabilitySection({ clubId, clubName, sports }: AvailabilitySectionProps) {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking flow state
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<"success" | "error" | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  async function handleSlotClick(slot: Slot) {
    // Check if user is logged in
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
      // Fire confetti celebration
      const end = Date.now() + 500;
      const frame = () => {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      // Refresh availability
      const supabase = createClient();
      const { data } = await supabase.rpc("get_club_availability", {
        p_club_id: clubId,
        p_date: format(date, "yyyy-MM-dd"),
        p_sport_type: selectedSport || undefined,
      });
      setSlots((data as Slot[]) ?? []);
    }
  }

  // Group by court
  const grouped = slots.reduce<Record<string, { name: string; sport: SportType; slots: Slot[] }>>(
    (acc, slot) => {
      if (!acc[slot.court_id]) {
        acc[slot.court_id] = { name: slot.court_name, sport: slot.court_sport_type, slots: [] };
      }
      acc[slot.court_id].slots.push(slot);
      return acc;
    },
    {}
  );

  const isPast = format(date, "yyyy-MM-dd") < format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <section>
        <h2 className="mb-4 text-lg font-semibold">Dostupni termini</h2>

        {/* Sport filter */}
        {sports.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Button
              variant={!selectedSport ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport(undefined)}
            >
              Svi sportovi
            </Button>
            {sports.map((sport) => (
              <Button
                key={sport}
                variant={selectedSport === sport ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport)}
              >
                {SPORT_LABELS[sport]}
              </Button>
            ))}
          </div>
        )}

        {/* Date navigator */}
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setDate(subDays(date, 1))}
            disabled={isPast}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center font-medium capitalize">
            {format(date, "EEEE, d. MMM", { locale: sr })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setDate(addDays(date, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Slots */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">Nema termina za ovaj dan</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded border" />
                <span>Slobodno</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded border-red-200 bg-red-50 border dark:border-red-900/30 dark:bg-red-950/20" />
                <span>Zauzeto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-muted/50 border border-muted" />
                <span>Blokirano</span>
              </div>
            </div>

            {Object.entries(grouped).map(([courtId, court]) => (
              <div key={courtId}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="font-medium">{court.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {SPORT_LABELS[court.sport]}
                  </Badge>
                </div>
                <motion.div
                  className="flex flex-wrap gap-2"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
                >
                  {court.slots.map((slot) => {
                    const isAvailable = slot.slot_status === "available";
                    const isBooked = slot.slot_status === "booked";

                    return (
                      <motion.button
                        key={`${courtId}-${slot.slot_start_time}`}
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 },
                        }}
                        onClick={() => isAvailable && handleSlotClick(slot)}
                        disabled={!isAvailable}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          isAvailable
                            ? "hover:border-primary hover:bg-primary/5 active:scale-95 cursor-pointer"
                            : isBooked
                              ? "border-red-200 bg-red-50 text-red-400 cursor-not-allowed dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-500/60"
                              : "border-muted bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                        }`}
                      >
                        <div className="font-medium">{slot.slot_start_time.slice(0, 5)}</div>
                        <div className="text-xs">
                          {isBooked
                            ? "Zauzeto"
                            : slot.slot_status === "blocked"
                              ? "Blokirano"
                              : `${slot.slot_price.toLocaleString()} RSD`}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open);
          if (!open && selectedSlot) {
            // After auth modal closes, check if user logged in
            const supabase = createClient();
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                handleAuthSuccess();
              }
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Termin rezervisan!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Plaćanje se vrši na licu mesta u klubu.
                  </p>
                </div>
                <div className="w-full rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">
                      {format(date, "EEEE, d. MMMM yyyy", { locale: sr })}
                    </span>
                  </div>
                  <div className="mt-1 ml-6">
                    {selectedSlot?.slot_start_time.slice(0, 5)} - {selectedSlot?.slot_end_time.slice(0, 5)}
                  </div>
                  <div className="mt-1 ml-6 font-medium">
                    {selectedSlot?.court_name}
                  </div>
                </div>
                <div className="flex w-full gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setConfirmOpen(false);
                      router.push("/bookings");
                    }}
                  >
                    Moje rezervacije
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Zatvori
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DialogHeader>
                  <DialogTitle>Potvrda rezervacije</DialogTitle>
                  <DialogDescription>
                    Proverite detalje pre potvrde
                  </DialogDescription>
                </DialogHeader>

                {selectedSlot && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg border p-4 space-y-3">
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
                      <Button
                        className="flex-1"
                        onClick={handleConfirmBooking}
                        disabled={booking}
                      >
                        {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Potvrdi rezervaciju
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmOpen(false)}
                        disabled={booking}
                      >
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
