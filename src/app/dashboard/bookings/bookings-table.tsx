"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, isToday } from "date-fns";
import { sr } from "date-fns/locale";
import {
  Loader2, Plus, Ban, CheckCircle, XCircle, Clock,
  DollarSign, User, Calendar, Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShimmerButton } from "@/components/ui/shimmer-button";
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

interface Club { id: string; name: string }
interface Court { id: string; name: string; club_id: string; sport_type: string }

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Aktivna", variant: "default" },
  cancelled: { label: "Otkazana", variant: "destructive" },
  completed: { label: "Završena", variant: "secondary" },
  no_show: { label: "Nije došao", variant: "outline" },
};

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", padel: "🏓",
  volleyball: "🏐", handball: "🤾", futsal: "⚽", other: "🏅",
};

export function BookingsTable({ bookings, clubs, courts }: { bookings: Booking[]; clubs: Club[]; courts: Court[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBookingError, setNewBookingError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = statusFilter === "all" ? bookings : bookings.filter((b) => b.status === statusFilter);

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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        {/* Status filter */}
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1 border border-border/50 dark:border-white/10 overflow-x-auto">
          {[
            { value: "all", label: "Sve" },
            { value: "confirmed", label: "Aktivne" },
            { value: "completed", label: "Završene" },
            { value: "cancelled", label: "Otkazane" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => setShowNewBooking(true)}
          className="bg-gradient-to-r from-[#059669] to-[#0ea87a] text-white shadow-md shadow-emerald-500/20 hover:brightness-110"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nova rezervacija
        </Button>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <div className="text-3xl mb-2">📋</div>
          <p className="font-medium">Nema rezervacija</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter !== "all" ? "Pokušaj drugi filter" : "Rezervacije će se pojaviti ovde"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => {
            const playerName = b.guest_name || b.profiles?.full_name || "Nepoznat";
            const playerPhone = b.guest_phone || b.profiles?.phone || "";
            const isLoading = loading === b.id;
            const statusCfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.confirmed;
            const sportIcon = b.courts ? SPORT_ICONS[b.courts.sport_type] ?? "🏅" : "🏅";
            const today = isToday(parseISO(b.date));

            return (
              <div
                key={b.id}
                className={`rounded-2xl border p-4 transition-all ${
                  b.status === "confirmed"
                    ? "border-border/50 dark:border-white/10"
                    : "border-border/30 opacity-70 dark:border-white/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Time + sport icon */}
                  <div className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-xs ${
                    b.status === "confirmed" ? "bg-primary/8" : "bg-muted"
                  }`}>
                    <span className="text-lg leading-none">{sportIcon}</span>
                    <span className={`text-[10px] font-medium mt-0.5 ${b.status === "confirmed" ? "text-primary" : "text-muted-foreground"}`}>
                      {b.start_time.slice(0, 5)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{b.courts?.name}</span>
                          {clubs.length > 1 && b.clubs?.name && (
                            <span className="text-xs text-muted-foreground hidden sm:inline">· {b.clubs.name}</span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{playerName}</span>
                          {playerPhone && <span className="hidden sm:inline">· {playerPhone}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={statusCfg.variant} className="text-[10px]">
                          {statusCfg.label}
                        </Badge>
                        <Badge
                          variant={b.payment_status === "paid" ? "default" : "outline"}
                          className="text-[10px] hidden sm:flex"
                        >
                          {b.payment_status === "paid" ? "Plaćeno" : "Čeka"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {today ? (
                          <span className="text-primary font-medium">Danas</span>
                        ) : (
                          <span className="capitalize">{format(parseISO(b.date), "EEE d. MMM", { locale: sr })}</span>
                        )}
                      </span>
                      <span>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</span>
                      <span className="font-semibold text-foreground">
                        {b.total_price.toLocaleString()} RSD
                      </span>
                    </div>

                    {/* Actions for confirmed */}
                    {b.status === "confirmed" && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {b.payment_status !== "paid" ? (
                          <button
                            onClick={() => handlePayment(b.id, "paid")}
                            disabled={isLoading}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100/70 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          >
                            <DollarSign className="h-3 w-3" />
                            Označi plaćeno
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePayment(b.id, "pending")}
                            disabled={isLoading}
                            className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted dark:border-white/10"
                          >
                            <Clock className="h-3 w-3" />
                            Nije plaćeno
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusChange(b.id, "completed")}
                          disabled={isLoading}
                          className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted dark:border-white/10"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Završeno
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, "no_show")}
                          disabled={isLoading}
                          className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted dark:border-white/10"
                        >
                          <Ban className="h-3 w-3" />
                          Nije došao
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, "cancelled")}
                          disabled={isLoading}
                          className="flex items-center gap-1 rounded-lg border border-red-200/50 px-2.5 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/20 dark:hover:bg-red-950/20"
                        >
                          <XCircle className="h-3 w-3" />
                          Otkaži
                        </button>
                        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                </div>
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
                  className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm dark:border-white/15"
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
                className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm dark:border-white/15"
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
              <Input type="date" name="date" required className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Od</Label>
                <Input type="time" name="startTime" required step="1800" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>Do</Label>
                <Input type="time" name="endTime" required step="1800" className="rounded-xl" />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Cena (RSD)</Label>
              <Input type="number" name="price" placeholder="0" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Ime gosta</Label>
                <Input name="guestName" placeholder="Opciono" className="rounded-xl" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefon gosta</Label>
                <Input name="guestPhone" placeholder="Opciono" className="rounded-xl" />
              </div>
            </div>

            {newBookingError && (
              <p className="text-sm text-destructive">{newBookingError}</p>
            )}

            <Button type="submit" disabled={creating} className="rounded-xl">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kreiraj rezervaciju
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
