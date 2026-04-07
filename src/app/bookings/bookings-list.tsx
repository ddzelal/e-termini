"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isBefore } from "date-fns";
import { sr } from "date-fns/locale";
import { Calendar, Clock, MapPin, Loader2 } from "lucide-react";
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

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Potvrđeno",
  cancelled: "Otkazano",
  completed: "Završeno",
  no_show: "Nepojavljivanje",
};

const STATUS_VARIANTS: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

export function BookingsList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => !isBefore(parseISO(b.date), now) && b.status !== "cancelled"
  );
  const past = bookings.filter(
    (b) => isBefore(parseISO(b.date), now) || b.status === "cancelled"
  );

  const displayed = tab === "upcoming" ? upcoming : past;

  async function handleCancel() {
    if (!cancelId) return;
    setCancelling(true);
    const result = await cancelBooking(cancelId);
    setCancelling(false);
    setCancelId(null);
    if (!result.error) {
      router.refresh();
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("upcoming")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "upcoming" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Predstojeće ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("past")}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "past" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Prošle ({past.length})
        </button>
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            {tab === "upcoming"
              ? "Nemate predstojeće rezervacije"
              : "Nemate prošle rezervacije"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border p-4 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  {booking.clubs && (
                    <h3 className="font-semibold">{booking.clubs.name}</h3>
                  )}
                  {booking.courts && (
                    <p className="text-sm text-muted-foreground">
                      {booking.courts.name} · {SPORT_LABELS[booking.courts.sport_type as keyof typeof SPORT_LABELS]}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 capitalize">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(booking.date), "EEE, d. MMM yyyy", { locale: sr })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Badge variant={STATUS_VARIANTS[booking.status]}>
                    {STATUS_LABELS[booking.status]}
                  </Badge>
                  <span className="text-sm font-semibold">
                    {booking.total_price.toLocaleString()} RSD
                  </span>
                </div>
              </div>

              {/* Cancel button for upcoming confirmed bookings */}
              {tab === "upcoming" && booking.status === "confirmed" && (
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelId(booking.id)}
                  >
                    Otkaži
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel confirmation */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Otkazivanje rezervacije</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite da otkažete ovu rezervaciju?
              Otkazivanje je moguće najkasnije 2 sata pre početka.
            </DialogDescription>
          </DialogHeader>
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
