"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SPORT_LABELS } from "@/lib/constants";
import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];

const SPORT_ICONS: Partial<Record<SportType, string>> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  padel: "🏓",
  volleyball: "🏐",
  handball: "🤾",
  futsal: "⚽",
};

interface ClubsSearchProps {
  defaultQuery?: string;
  defaultCity?: string;
  defaultSport?: string;
  cities: string[];
  sports: SportType[];
}

export function ClubsSearch({
  defaultQuery,
  defaultCity,
  defaultSport,
  cities,
  sports,
}: ClubsSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery ?? "");
  const [selectedSport, setSelectedSport] = useState<string>(defaultSport ?? "");
  const [selectedCity, setSelectedCity] = useState<string>(defaultCity ?? "");
  const [showFilters, setShowFilters] = useState(!!(defaultCity || defaultSport));

  function applyFilters(overrides?: { q?: string; sport?: string; city?: string }) {
    const params = new URLSearchParams();
    const q = overrides?.q ?? query;
    const sport = overrides?.sport ?? selectedSport;
    const city = overrides?.city ?? selectedCity;

    if (q.trim()) params.set("q", q.trim());
    if (sport) params.set("sport", sport);
    if (city) params.set("city", city);

    const qs = params.toString();
    router.push(`/clubs${qs ? `?${qs}` : ""}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  function handleSportClick(sport: string) {
    const next = selectedSport === sport ? "" : sport;
    setSelectedSport(next);
    applyFilters({ sport: next });
  }

  function handleCityClick(city: string) {
    const next = selectedCity === city ? "" : city;
    setSelectedCity(next);
    applyFilters({ city: next });
  }

  function clearAll() {
    setQuery("");
    setSelectedSport("");
    setSelectedCity("");
    router.push("/clubs");
  }

  const hasFilters = !!(query || selectedSport || selectedCity);

  return (
    <div className="space-y-4">
      {/* Search input */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretraži po imenu kluba ili gradu..."
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 dark:border-white/15 dark:bg-white/[0.04] dark:focus:border-primary/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); applyFilters({ q: "" }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              showFilters || hasFilters
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:border-white/15"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/20 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              {/* Sport filter */}
              {sports.length > 0 && (
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Sport
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sports.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => handleSportClick(sport)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                          selectedSport === sport
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground dark:border-white/10 dark:hover:border-white/20"
                        }`}
                      >
                        <span className="text-base leading-none">{SPORT_ICONS[sport] ?? "🏅"}</span>
                        {SPORT_LABELS[sport]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* City filter */}
              {cities.length > 0 && (
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Grad
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCityClick(city)}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                          selectedCity === city
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground dark:border-white/10 dark:hover:border-white/20"
                        }`}
                      >
                        <MapPin className="h-3 w-3" />
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear all */}
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Obriši sve filtere
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
