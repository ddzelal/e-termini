"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X, User, UserPlus, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { assignOwner } from "@/lib/admin-actions";

export function OwnerSection({
  clubId,
  currentOwnerId,
}: {
  clubId: string;
  currentOwnerId: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState<{ id: string; full_name: string } | null>(null);

  useEffect(() => {
    if (currentOwnerId) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", currentOwnerId)
        .single()
        .then(({ data }) => {
          if (data) setOwner(data);
        });
    }
  }, [currentOwnerId]);

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .ilike("full_name", `%${search}%`)
      .limit(5);
    setResults(data ?? []);
    setSearching(false);
  }

  async function handleAssign(userId: string, fullName: string) {
    setLoading(true);
    await assignOwner(clubId, userId);
    setOwner({ id: userId, full_name: fullName });
    setResults([]);
    setSearch("");
    setLoading(false);
    router.refresh();
  }

  async function handleRemove() {
    setLoading(true);
    await assignOwner(clubId, null);
    setOwner(null);
    setLoading(false);
    router.refresh();
  }

  const ROLE_LABELS: Record<string, string> = {
    player: "Igrač",
    club_owner: "Vlasnik",
    admin: "Admin",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold">Vlasnik kluba</h2>
      </div>

      {owner ? (
        /* === Has owner === */
        <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#059669] to-[#34d399] text-sm font-bold text-white">
              {owner.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{owner.full_name}</p>
              <p className="text-xs text-muted-foreground">Vlasnik kluba · Ima pristup dashboard-u</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/50 text-red-500 transition-colors hover:bg-red-50 dark:border-red-900/20 dark:hover:bg-red-950/20"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : (
        /* === No owner === */
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-amber-300/50 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
            <div className="flex items-center gap-2 text-sm">
              <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium text-amber-800 dark:text-amber-300">Klub nema vlasnika</span>
            </div>
            <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/60">
              Pretražite korisnike po imenu da dodelite vlasnika. Korisnik će automatski dobiti ulogu "Vlasnik kluba" i pristup dashboard-u.
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Pretraži korisnike po imenu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                className="h-10 w-full rounded-xl border border-border/50 bg-background pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 dark:border-white/15"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="rounded-xl border border-border/50 overflow-hidden dark:border-white/10">
              {results.map((user, i) => (
                <button
                  key={user.id}
                  onClick={() => handleAssign(user.id, user.full_name)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-muted/50 ${
                    i > 0 ? "border-t border-border/30" : ""
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-primary">Dodeli →</span>
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && search && !searching && (
            <p className="text-xs text-muted-foreground text-center py-2">Nema rezultata za "{search}"</p>
          )}
        </div>
      )}
    </section>
  );
}
