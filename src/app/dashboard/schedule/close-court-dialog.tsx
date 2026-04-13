"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, CalendarX, Phone, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createCourtClosure } from "@/lib/dashboard-actions";

interface Court {
  id: string;
  name: string;
  club_id: string;
  sport_type: string;
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

interface CloseCourtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  defaultCourtId?: string;
  onClosed?: () => void;
}

export function CloseCourtDialog({
  open,
  onOpenChange,
  courts,
  defaultCourtId,
  onClosed,
}: CloseCourtDialogProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");

  const [courtId, setCourtId] = useState(defaultCourtId ?? courts[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [successState, setSuccessState] = useState<{
    affectedCount: number;
    affected: AffectedBooking[];
  } | null>(null);

  function resetAndClose() {
    setCourtId(defaultCourtId ?? courts[0]?.id ?? "");
    setStartDate(today);
    setEndDate(today);
    setReason("");
    setNotify(true);
    setError(null);
    setSubmitting(false);
    setSuccessState(null);
    onOpenChange(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 3) {
      setError("Razlog mora imati najmanje 3 znaka.");
      return;
    }
    if (startDate > endDate) {
      setError("Datum početka mora biti pre ili jednak datumu kraja.");
      return;
    }
    if (!courtId) {
      setError("Izaberite teren.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.set("courtId", courtId);
    formData.set("startDate", startDate);
    formData.set("endDate", endDate);
    formData.set("reason", reason.trim());
    formData.set("notify", notify ? "true" : "false");

    const result = await createCourtClosure(formData);
    setSubmitting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSuccessState({
      affectedCount: result.affectedCount ?? 0,
      affected: (result.affected ?? []) as AffectedBooking[],
    });

    if (onClosed) onClosed();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {successState ? (
          <div className="space-y-4">
            <DialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle>Teren zatvoren</DialogTitle>
              <DialogDescription>
                {successState.affectedCount === 0
                  ? "Nije bilo aktivnih rezervacija u tom periodu."
                  : `Otkazano rezervacija: ${successState.affectedCount}. Kontaktirajte igrače.`}
              </DialogDescription>
            </DialogHeader>

            {successState.affected.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/40 dark:border-white/10 dark:divide-white/10">
                {successState.affected.map((booking) => (
                  <div
                    key={booking.booking_id}
                    className="flex items-center justify-between gap-3 p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {booking.player_name ?? "Nepoznato"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.date} · {booking.start_time.slice(0, 5)}–
                        {booking.end_time.slice(0, 5)}
                      </div>
                    </div>
                    {booking.player_phone && (
                      <a
                        href={`tel:${booking.player_phone}`}
                        className={buttonVariants({
                          size: "sm",
                          variant: "outline",
                          className: "shrink-0",
                        })}
                      >
                        <Phone className="mr-1.5 h-3.5 w-3.5" />
                        Pozovi
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button onClick={resetAndClose} className="w-full">
              Zatvori
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <CalendarX className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle>Zatvori teren</DialogTitle>
              <DialogDescription>
                Označite teren kao zatvoren za određeni period. Postojeće rezervacije u tom periodu biće automatski otkazane.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label htmlFor="court">Teren</Label>
              <select
                id="court"
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm dark:border-white/15"
                required
              >
                {courts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="start">Od datuma</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="end">Do datuma</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="reason">Razlog</Label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="npr. Kiša, održavanje, privatni događaj..."
                className="rounded-md border border-border bg-background px-3 py-2 text-sm dark:border-white/15"
                required
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                Razlog će biti vidljiv u evidenciji i prilikom otkazivanja rezervacija.
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <span className="text-muted-foreground">
                Označi da pogođene igrače treba kontaktirati (telefoni će biti prikazani nakon zatvaranja).
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
                variant="destructive"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Zatvori teren
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={submitting}
              >
                Otkaži
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
