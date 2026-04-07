"use client";

import { useEffect, useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { sr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Court {
  id: string;
  name: string;
  club_id: string;
  sport_type: string;
}

interface Club {
  id: string;
  name: string;
}

interface SlotData {
  court_id: string;
  court_name: string;
  slot_start_time: string;
  slot_end_time: string;
  slot_status: string;
  slot_price: number;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 - 22:00

export function WeeklySchedule({ clubs, courts }: { clubs: Club[]; courts: Court[] }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.id ?? "");
  const [dayData, setDayData] = useState<Record<string, SlotData[]>>({});
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const filteredCourts = courts.filter((c) => c.club_id === selectedClub);

  useEffect(() => {
    async function fetchWeek() {
      setLoading(true);
      const supabase = createClient();
      const results: Record<string, SlotData[]> = {};

      await Promise.all(
        days.map(async (day) => {
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
    }

    if (selectedClub) fetchWeek();
  }, [weekStart, selectedClub]);

  function getSlotStatus(courtId: string, dateStr: string, hour: number): string {
    const slots = dayData[dateStr] ?? [];
    const timeStr = `${hour.toString().padStart(2, "0")}:00:00`;
    const slot = slots.find(
      (s) => s.court_id === courtId && s.slot_start_time === timeStr
    );
    return slot?.slot_status ?? "unknown";
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {clubs.length > 1 && (
          <select
            className="h-8 rounded-md border bg-background px-2 text-sm"
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
          >
            {clubs.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[200px] text-center text-sm font-medium">
            {format(days[0], "d. MMM", { locale: sr })} — {format(days[6], "d. MMM yyyy", { locale: sr })}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-100 border border-green-200 dark:bg-green-950 dark:border-green-900" />
          Slobodno
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-100 border border-red-200 dark:bg-red-950 dark:border-red-900" />
          Zauzeto
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-muted border" />
          Blokirano
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredCourts.map((court) => (
            <div key={court.id} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold">{court.name}</h3>
              <div className="min-w-[700px]">
                {/* Header row */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-px text-xs">
                  <div />
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`py-1 text-center font-medium capitalize ${
                        isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {format(day, "EEE d.", { locale: sr })}
                    </div>
                  ))}
                </div>

                {/* Hour rows */}
                {HOURS.map((hour) => (
                  <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] gap-px">
                    <div className="py-1 pr-2 text-right text-xs text-muted-foreground">
                      {hour}:00
                    </div>
                    {days.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const status = getSlotStatus(court.id, dateStr, hour);
                      return (
                        <div
                          key={dateStr}
                          className={`h-7 rounded-sm border text-[10px] flex items-center justify-center ${
                            status === "available"
                              ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900/50"
                              : status === "booked"
                                ? "bg-red-50 border-red-200 text-red-500 dark:bg-red-950/30 dark:border-red-900/50"
                                : status === "blocked"
                                  ? "bg-muted border-muted-foreground/20 text-muted-foreground"
                                  : "bg-muted/30 border-muted"
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
          ))}
        </div>
      )}
    </div>
  );
}
