"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { sr } from "date-fns/locale";
import { Loader2, ShieldBan, Trash2, User, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  removeFromBlacklist,
  addToBlacklist,
  searchUsersForBlacklist,
} from "@/lib/blacklist-actions";

interface BlacklistEntry {
  id: string;
  club_id: string;
  user_id: string;
  reason: string | null;
  created_at: string;
  profiles: { full_name: string; phone: string | null } | null;
  clubs: { name: string } | null;
}

interface Club {
  id: string;
  name: string;
}

interface SearchedUser {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
}

export function BlacklistTable({
  entries,
  clubs,
}: {
  entries: BlacklistEntry[];
  clubs: Club[];
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<BlacklistEntry | null>(null);

  // Add user to blacklist state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [selectedClub, setSelectedClub] = useState(clubs[0]?.id ?? "");
  const [addReason, setAddReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function handleSearch() {
    if (searchQuery.length < 2) return;
    setSearching(true);
    const result = await searchUsersForBlacklist(searchQuery);
    setSearchResults(result.data ?? []);
    setSearching(false);
  }

  function closeAddDialog() {
    setShowAddDialog(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setAddReason("");
    setAddError(null);
  }

  async function handleAdd() {
    if (!selectedUser || !selectedClub) return;
    setAdding(true);
    setAddError(null);
    const result = await addToBlacklist(selectedClub, selectedUser.id, addReason);
    setAdding(false);
    if (result.error) {
      setAddError(result.error);
      return;
    }
    const msg = result.cancelledCount && result.cancelledCount > 0
      ? `Korisnik blokiran. ${result.cancelledCount} aktivna rezervacija je automatski otkazana.`
      : "Korisnik blokiran.";
    closeAddDialog();
    alert(msg);
    router.refresh();
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    setRemoving(confirmRemove.id);
    await removeFromBlacklist(confirmRemove.club_id, confirmRemove.user_id);
    setRemoving(null);
    setConfirmRemove(null);
    router.refresh();
  }

  return (
    <>
      {/* Add user button */}
      <div className="flex justify-end mb-4">
        <Button
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Dodaj na crnu listu
        </Button>
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <ShieldBan className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="font-medium">Nema blokiranih korisnika</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Koristite dugme &quot;Dodaj na crnu listu&quot; ili blokirajte korisnika iz rezervacija
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-border/50 dark:border-white/10 p-4 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20">
                  <ShieldBan className="h-5 w-5 text-red-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {entry.profiles?.full_name || "Nepoznat"}
                        </span>
                        {entry.clubs?.name && (
                          <span className="text-xs text-muted-foreground">
                            · {entry.clubs.name}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.profiles?.phone || "Bez telefona"}
                        <span>
                          · Blokiran{" "}
                          <span className="capitalize">
                            {format(parseISO(entry.created_at), "d. MMM yyyy", {
                              locale: sr,
                            })}
                          </span>
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="mt-1.5 text-xs text-muted-foreground italic">
                          &ldquo;{entry.reason}&rdquo;
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setConfirmRemove(entry)}
                      className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/10"
                    >
                      <Trash2 className="h-3 w-3" />
                      Ukloni
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to blacklist dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeAddDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj korisnika na crnu listu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 mt-2">
            {/* Club selector */}
            {clubs.length > 1 && (
              <div className="grid gap-1.5">
                <Label>Klub</Label>
                <select
                  className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm dark:border-white/15"
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                >
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User search */}
            {!selectedUser ? (
              <div className="grid gap-1.5">
                <Label>Pretraži korisnika po imenu ili telefonu</Label>
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Ime ili broj telefona..."
                    className="rounded-xl"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searching || searchQuery.length < 2}
                    className="rounded-xl shrink-0"
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 dark:border-white/10">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUser(u)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors border-b border-border/30 last:border-0 dark:border-white/5"
                      >
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.full_name}</div>
                          {u.phone && (
                            <div className="text-xs text-muted-foreground">{u.phone}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                  <p className="text-xs text-muted-foreground">Nema rezultata. Pokušajte drugi termin.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-1.5">
                <Label>Izabrani korisnik</Label>
                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-3 py-2 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{selectedUser.full_name}</div>
                      {selectedUser.phone && (
                        <div className="text-xs text-muted-foreground">{selectedUser.phone}</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Promeni
                  </button>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="grid gap-1.5">
              <Label>Razlog (opciono)</Label>
              <Textarea
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                placeholder="Npr. višestruko nepojavljivanje..."
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            {addError && <p className="text-sm text-destructive">{addError}</p>}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeAddDialog} className="rounded-xl">
                Odustani
              </Button>
              <Button
                onClick={handleAdd}
                disabled={adding || !selectedUser}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              >
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Blokiraj
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm remove dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ukloni sa crne liste</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 mt-2">
            <p className="text-sm text-muted-foreground">
              Da li ste sigurni da želite da uklonite{" "}
              <strong>{confirmRemove?.profiles?.full_name}</strong> sa crne liste? Korisnik
              će ponovo moći da rezerviše termine.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setConfirmRemove(null)}
                className="rounded-xl"
              >
                Odustani
              </Button>
              <Button
                onClick={handleRemove}
                disabled={removing === confirmRemove?.id}
                className="rounded-xl"
              >
                {removing === confirmRemove?.id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ukloni
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
