"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [results, setResults] = useState<{ id: string; full_name: string; email?: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [owner, setOwner] = useState<{ id: string; full_name: string } | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load current owner on first render
  if (!initialized && currentOwnerId) {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", currentOwnerId)
      .single()
      .then(({ data }) => {
        if (data) setOwner(data);
      });
    setInitialized(true);
  } else if (!initialized) {
    setInitialized(true);
  }

  async function handleSearch() {
    if (!search.trim()) return;
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
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

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Vlasnik kluba</h2>

      {owner ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <span className="font-medium">{owner.full_name}</span>
          <Button variant="ghost" size="icon-xs" onClick={handleRemove} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Pretraži korisnike po imenu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              className="h-9"
            />
            <Button variant="outline" size="sm" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="rounded-lg border divide-y">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssign(user.id, user.full_name)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-muted/50"
                  disabled={loading}
                >
                  <span>{user.full_name}</span>
                  <span className="text-xs text-muted-foreground">Dodeli</span>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Klub nema dodeljenog vlasnika. Pretražite korisnike da dodelite.
          </p>
        </div>
      )}
    </section>
  );
}
