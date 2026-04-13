"use client";

import { useCallback, useEffect, useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { sr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CalendarX } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CloseCourtDialog } from "./close-court-dialog";

interface Court { id: string; name: string; club_id: string; sport_type: string }
interface Club { id: string; name: string }

interface SlotData {
  court_id: string;
  court_name: string;
  slot_start_time: string;
  slot_end_time: string;
  slot_status: string;
  slot_price: number;
}

const SPORT_ICONS: Record<string, string> = {
  football: "⚽", basketball: "🏀", tennis: "🎾", padel: "🏓",
  volleyball: "🏐", handball: "🤾", futsal: "⚽", other: "🏅",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

export function WeeklySchedule({ clubs, courts }: { clubs: Club[]; courts: Court[] }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.id ?? "");
  const [dayData, setDayData] = useState<Record<string, SlotData[]>>({});
  const [loading, setLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const filteredCourts = courts.filter((c) => c.club_id === selectedClub);

  const fetchWeek = useCallback(async () => {
    if (!selectedClub) return;
    setLoading(true);
    const supabase = createClient();
    const results: Record<string, SlotData[]> = {};

    await Promise.all(
      Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(async (day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const { data } = await supabase.rpc("get_club_availability", {
          p_club_id: selectedClub,
          p_date: dateStr,
        });
        results[dateStr] = (data as SlotData[]) ?? [];
      })
    );

    setDayData(results);
    setLoading(false);
  }, [weekStart, selectedClub]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  function getSlotStatus(courtId: string, dateStr: string, hour: number): string {
    const slots = dayData[dateStr] ?? [];
    const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;
    const slot = slots.find(
      (s) => s.court_id === courtId && s.slot_start_time === timeStr
    );
    return slot?.slot_status ?? "unknown";
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Club selector */}
        {clubs.length > 1 && (
          <select
            className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm dark:border-white/15"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* Week navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted dark:border-white/15"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[200px] text-center text-sm font-medium">
            {format(days[0], "d. MMM", { locale: sr })} — {format(days[6], "d. MMM yyyy", { locale: sr })}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/50 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted dark:border-white/15"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Close court action */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCloseDialogOpen(true)}
          disabled={filteredCourts.length === 0}
          className="ml-auto"
        >
          <CalendarX className="mr-1.5 h-4 w-4" />
          Zatvori teren
        </Button>
      </div>

      <CloseCourtDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        courts={filteredCourts}
        onClosed={fetchWeek}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm border border-primary/30 bg-primary/10" />
          Slobodno
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm border border-red-200 bg-red-100 dark:border-red-900/40 dark:bg-red-950/40" />
          Zauzeto
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm bg-muted border border-border/50" />
          Zatvoreno
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCourts.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <div className="text-3xl mb-2">🏟️</div>
          <p className="font-medium">Nema terena</p>
        </div>
      ) : (
        <motion.div
          key={`${weekStart.toISOString()}-${selectedClub}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {filteredCourts.map((court) => (
            <div key={court.id} className="rounded-2xl border border-border/50 p-4 dark:border-white/10">
              {/* Court header */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base leading-none">{SPORT_ICONS[court.sport_type] ?? "🏅"}</span>
                <h3 className="text-sm font-semibold">{court.name}</h3>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="min-w-[600px]">
                  {/* Day headers */}
                  <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-0.5 mb-1">
                    <div />
                    {days.map((day) => {
                      const today = isSameDay(day, new Date());
                      return (
                        <div
                          key={day.toISOString()}
                          className={`py-1.5 text-center rounded-lg text-[11px] font-medium ${
                            today
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div className="capitalize">{format(day, "EEE", { locale: sr })}</div>
                          <div className={`text-sm font-bold ${today ? "" : "text-foreground"}`}>
                            {format(day, "d")}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hour rows */}
                  {HOURS.map((hour) => (
                    <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] gap-0.5">
                      <div className="flex items-center justify-end pr-2 text-[10px] text-muted-foreground/70">
                        {hour}:00
                      </div>
                      {days.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const status = getSlotStatus(court.id, dateStr, hour);
                        const today = isSameDay(day, new Date());

                        return (
                          <div
                            key={dateStr}
                            title={status === "past" ? "Prošlo vreme" : undefined}
                            className={`h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition-colors ${
                              status === "available"
                                ? `border border-primary/20 bg-primary/[0.06] ${today ? "border-primary/30 bg-primary/10" : ""}`
                                : status === "booked"
                                  ? "border border-red-200/50 bg-red-50 text-red-500 dark:border-red-900/30 dark:bg-red-950/30 dark:text-red-400"
                                  : status === "blocked"
                                    ? "bg-muted/50 text-muted-foreground/40 border border-border/30"
                                    : status === "past"
                                      ? "bg-muted/10 text-muted-foreground/30 border border-dashed border-border/40"
                                      : "bg-muted/20 border border-transparent"
                            }`}
                          >
                            {status === "booked" && "●"}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
