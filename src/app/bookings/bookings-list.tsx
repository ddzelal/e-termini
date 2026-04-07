"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, parseISO, startOfDay, isToday as checkIsToday } from "date-fns";
import { sr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Loader2, ExternalLink, CalendarX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SPORT_LABELS } from "@/lib/constants";
import { cancelBooking } from "@/lib/booking-actions";
import type { Database } from "@/lib/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  clubs: { name: string; slug: string } | null;
  courts: { name: string; sport_type: string } | null;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  confirmed: { label: "Potvrđeno", variant: "default", color: "text-primary" },
  completed: { label: "Završeno", variant: "secondary", color: "text-muted-foreground" },
  cancelled: { label: "Otkazano", variant: "destructive", color: "text-destructive" },
  no_show: { label: "Nepojavljivanje", variant: "outline", color: "text-muted-foreground" },
};

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", padel: "🏓",
  volleyball: "🏐", handball: "🤾", futsal: "⚽", other: "🏅",
};

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const today = startOfDay(new Date());

  // Upcoming: date >= today AND not cancelled/completed/no_show
  const upcoming = bookings.filter((b) => {
    const bookingDate = startOfDay(parseISO(b.date));
    return bookingDate >= today && b.status === "confirmed";
  });

  // Past: everything else
  const past = bookings.filter((b) => {
    const bookingDate = startOfDay(parseISO(b.date));
    return bookingDate < today || b.status !== "confirmed";
  });

  const displayed = tab === "upcoming" ? upcoming : past;

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    setCancelError(null);
    const result = await cancelBooking(cancelId);
    setCancelling(false);
    if (result.error) {
      setCancelError(result.error);
    } else {
      setCancelId(null);
      router.refresh();
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-muted/50 p-1 border border-border/50 dark:border-white/10">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            tab === "upcoming"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Predstojeće
          {upcoming.length > 0 && (
            <span className={`ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              tab === "upcoming" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
            }`}>
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("past")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            tab === "past"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Istorija
          {past.length > 0 && (
            <span className={`ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              tab === "past" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
            }`}>
              {past.length}
            </span>
          )}
        </button>
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {displayed.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <div className="text-4xl mb-3">
                {tab === "upcoming" ? "📅" : "📋"}
              </div>
              <p className="font-medium">
                {tab === "upcoming"
                  ? "Nema predstojećih rezervacija"
                  : "Nema prošlih rezervacija"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tab === "upcoming" && (
                  <Link href="/clubs" className="text-primary hover:underline">
                    Pronađi teren i rezerviši
                  </Link>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map((booking) => {
                const isToday = checkIsToday(parseISO(booking.date));
                const statusCfg = STATUS_CONFIG[booking.status];
                const sportIcon = booking.courts
                  ? SPORT_ICONS[booking.courts.sport_type] ?? "🏅"
                  : "🏅";

                return (
                  <div
                    key={booking.id}
                    className={`group rounded-2xl border p-4 transition-all ${
                      booking.status === "confirmed"
                        ? "border-border/50 hover:border-primary/20 hover:shadow-sm dark:border-white/10"
                        : "border-border/30 opacity-75 dark:border-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Sport icon */}
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                        booking.status === "confirmed" ? "bg-primary/8" : "bg-muted"
                      }`}>
                        {sportIcon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {booking.clubs && (
                              <Link
                                href={`/clubs/${booking.clubs.slug}`}
                                className="font-semibold hover:text-primary transition-colors truncate block"
                              >
                                {booking.clubs.name}
                              </Link>
                            )}
                            {booking.courts && (
                              <p className="text-sm text-muted-foreground truncate">
                                {booking.courts.name} · {SPORT_LABELS[booking.courts.sport_type as keyof typeof SPORT_LABELS]}
                              </p>
                            )}
                          </div>
                          <Badge variant={statusCfg.variant} className="shrink-0">
                            {statusCfg.label}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 capitalize">
                            <Calendar className="h-3.5 w-3.5" />
                            {isToday ? (
                              <span className="text-primary font-medium">Danas</span>
                            ) : (
                              format(parseISO(booking.date), "EEE, d. MMM yyyy", { locale: sr })
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </span>
                          <span className="font-semibold text-foreground">
                            {booking.total_price.toLocaleString()} RSD
                          </span>
                        </div>

                        {/* Actions */}
                        {tab === "upcoming" && booking.status === "confirmed" && (
                          <div className="mt-3 flex items-center gap-2">
                            <Link
                              href={`/clubs/${booking.clubs?.slug}`}
                              className="flex items-center gap-1 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted dark:border-white/10"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Otvori klub
                            </Link>
                            <button
                              onClick={() => setCancelId(booking.id)}
                              className="flex items-center gap-1 rounded-lg border border-red-200/50 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/20 dark:hover:bg-red-950/20"
                            >
                              <CalendarX className="h-3 w-3" />
                              Otkaži
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cancel confirmation */}
      <Dialog open={!!cancelId} onOpenChange={() => { setCancelId(null); setCancelError(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Otkazivanje rezervacije</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da otkažete ovu rezervaciju?
              Otkazivanje je moguće najkasnije 2 sata pre početka.
            </DialogDescription>
          </DialogHeader>
          {cancelError && (
            <p className="text-sm text-destructive">{cancelError}</p>
          )}
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setCancelId(null)} disabled={cancelling}>
              Ne
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Da, otkaži
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
