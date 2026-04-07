"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { Loader2, Plus, Ban, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPORT_LABELS } from "@/lib/constants";
import {
  updateBookingStatus,
  updatePaymentStatus,
  createManualBooking,
} from "@/lib/dashboard-actions";

interface Booking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  payment_status: string;
  booked_by: string;
  guest_name: string | null;
  guest_phone: string | null;
  notes: string | null;
  clubs: { id: string; name: string } | null;
  courts: { id: string; name: string; sport_type: string } | null;
  profiles: { full_name: string; phone: string | null } | null;
}

interface Club {
  id: string;
  name: string;
}

interface Court {
  id: string;
  name: string;
  club_id: string;
  sport_type: string;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Potvrđeno",
  cancelled: "Otkazano",
  completed: "Završeno",
  no_show: "Nepojavljivanje",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Čeka",
  paid: "Plaćeno",
};

export function BookingsTable({
  bookings,
  clubs,
  courts,
}: {
  bookings: Booking[];
  clubs: Club[];
  courts: Court[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBookingError, setNewBookingError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.id ?? "");

  async function handleStatusChange(bookingId: string, status: string) {
    setLoading(bookingId);
    await updateBookingStatus(bookingId, status as "confirmed" | "cancelled" | "completed" | "no_show");
    setLoading(null);
    router.refresh();
  }

  async function handlePayment(bookingId: string, status: string) {
    setLoading(bookingId);
    await updatePaymentStatus(bookingId, status as "pending" | "paid");
    setLoading(null);
    router.refresh();
  }

  async function handleCreateBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setNewBookingError(null);
    const formData = new FormData(e.currentTarget);
    const result = await createManualBooking(formData);
    setCreating(false);
    if (result.error) {
      setNewBookingError(result.error);
    } else {
      setShowNewBooking(false);
      router.refresh();
    }
  }

  const filteredCourts = courts.filter((c) => c.club_id === selectedClub);

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNewBooking(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova rezervacija
        </Button>
      </div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">Nema rezervacija</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const playerName = b.guest_name || b.profiles?.full_name || "—";
            const playerPhone = b.guest_phone || b.profiles?.phone || "";
            const isLoading = loading === b.id;

            return (
              <div key={b.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {format(parseISO(b.date), "EEE d. MMM", { locale: sr })}
                      </span>
                      <span className="font-semibold">
                        {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {b.courts?.name}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {playerName}{playerPhone ? ` · ${playerPhone}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        b.status === "confirmed" ? "default" :
                        b.status === "cancelled" ? "destructive" : "secondary"
                      }
                    >
                      {STATUS_LABELS[b.status]}
                    </Badge>
                    <Badge variant={b.payment_status === "paid" ? "default" : "outline"}>
                      {PAYMENT_LABELS[b.payment_status]}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {b.total_price.toLocaleString()} RSD
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {b.status === "confirmed" && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                    {b.payment_status !== "paid" && (
                      <Button
                        variant="outline" size="xs"
                        onClick={() => handlePayment(b.id, "paid")}
                        disabled={isLoading}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Plaćeno
                      </Button>
                    )}
                    {b.payment_status === "paid" && (
                      <Button
                        variant="outline" size="xs"
                        onClick={() => handlePayment(b.id, "pending")}
                        disabled={isLoading}
                      >
                        <Clock className="mr-1 h-3 w-3" />
                        Nije plaćeno
                      </Button>
                    )}
                    <Button
                      variant="outline" size="xs"
                      onClick={() => handleStatusChange(b.id, "completed")}
                      disabled={isLoading}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Završeno
                    </Button>
                    <Button
                      variant="outline" size="xs"
                      onClick={() => handleStatusChange(b.id, "no_show")}
                      disabled={isLoading}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      Nije došao
                    </Button>
                    <Button
                      variant="outline" size="xs"
                      onClick={() => handleStatusChange(b.id, "cancelled")}
                      disabled={isLoading}
                    >
                      <XCircle className="mr-1 h-3 w-3" />
                      Otkaži
                    </Button>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New booking dialog */}
      <Dialog open={showNewBooking} onOpenChange={setShowNewBooking}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova ručna rezervacija</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateBooking} className="grid gap-3 mt-2">
            {clubs.length > 1 && (
              <div className="grid gap-1.5">
                <Label>Klub</Label>
                <select
                  name="clubId"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {clubs.length === 1 && <input type="hidden" name="clubId" value={clubs[0].id} />}

            <div className="grid gap-1.5">
              <Label>Teren</Label>
              <select
                name="courtId"
                required
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {filteredCourts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({SPORT_LABELS[c.sport_type as keyof typeof SPORT_LABELS]})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label>Datum</Label>
              <Input type="date" name="date" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Od</Label>
                <Input type="time" name="startTime" required step="1800" />
              </div>
              <div className="grid gap-1.5">
                <Label>Do</Label>
                <Input type="time" name="endTime" required step="1800" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Cena (RSD)</Label>
              <Input type="number" name="price" placeholder="0" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Ime gosta</Label>
                <Input name="guestName" placeholder="Opciono" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefon gosta</Label>
                <Input name="guestPhone" placeholder="Opciono" />
              </div>
            </div>

            {newBookingError && (
              <p className="text-sm text-destructive">{newBookingError}</p>
            )}

            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kreiraj rezervaciju
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
