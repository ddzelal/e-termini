"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPORT_LABELS, SURFACE_LABELS, DAY_LABELS } from "@/lib/constants";
import { saveCourt, savePricingRule, deletePricingRule } from "@/lib/admin-actions";

interface PricingRule {
  id: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  price_per_hour: number;
}

interface Court {
  id: string;
  name: string;
  sport_type: string;
  surface_type: string | null;
  is_indoor: boolean;
  max_players: number | null;
  price_per_hour: number;
  is_active: boolean;
  court_pricing_rules: PricingRule[];
}

const SPORTS = Object.entries(SPORT_LABELS);
const SURFACES = Object.entries(SURFACE_LABELS);

export function CourtsSection({ clubId, courts }: { clubId: string; courts: Court[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editCourt, setEditCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  async function handleSaveCourt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("clubId", clubId);
    if (editCourt) formData.set("courtId", editCourt.id);

    const result = await saveCourt(formData);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setShowForm(false);
    setEditCourt(null);
    router.refresh();
  }

  async function handleSavePricing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPricingLoading(true);
    const formData = new FormData(e.currentTarget);
    await savePricingRule(formData);
    setPricingLoading(false);
    router.refresh();
  }

  async function handleDeleteRule(ruleId: string) {
    await deletePricingRule(ruleId);
    router.refresh();
  }

  function openEdit(court: Court) {
    setEditCourt(court);
    setShowForm(true);
    setError(null);
  }

  function openNew() {
    setEditCourt(null);
    setShowForm(true);
    setError(null);
  }

  const pricingCourt = courts.find((c) => c.id === showPricing);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tereni</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          Dodaj teren
        </Button>
      </div>

      {courts.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center">
          <p className="text-muted-foreground">Nema terena</p>
        </div>
      ) : (
        <div className="space-y-2">
          {courts.map((court) => (
            <div key={court.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{court.name}</span>
                  <Badge variant="outline" className="text-xs">{SPORT_LABELS[court.sport_type as keyof typeof SPORT_LABELS]}</Badge>
                  {!court.is_active && <Badge variant="secondary" className="text-xs">Neaktivan</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{court.price_per_hour.toLocaleString()} RSD/h</span>
                  <Button variant="outline" size="xs" onClick={() => setShowPricing(court.id)}>
                    Cene
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => openEdit(court)}>
                    Uredi
                  </Button>
                </div>
              </div>
              <div className="mt-1 flex gap-1 text-xs text-muted-foreground">
                {court.surface_type && <span>{SURFACE_LABELS[court.surface_type as keyof typeof SURFACE_LABELS]}</span>}
                {court.is_indoor && <span>· Zatvoreno</span>}
                {court.max_players && <span>· Max {court.max_players} igrača</span>}
                {court.court_pricing_rules.length > 0 && <span>· {court.court_pricing_rules.length} cenovnih pravila</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Court form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editCourt ? "Uredi teren" : "Novi teren"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCourt} className="grid gap-3 mt-2">
            <div className="grid gap-1.5">
              <Label>Naziv *</Label>
              <Input name="courtName" required defaultValue={editCourt?.name ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label>Sport *</Label>
              <select name="sport_type" required className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue={editCourt?.sport_type ?? "football"}>
                {SPORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Podloga</Label>
              <select name="surface_type" className="h-9 rounded-md border bg-background px-3 text-sm" defaultValue={editCourt?.surface_type ?? ""}>
                <option value="">—</option>
                {SURFACES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Cena/sat (RSD) *</Label>
                <Input name="price_per_hour" type="number" required defaultValue={editCourt?.price_per_hour ?? ""} />
              </div>
              <div className="grid gap-1.5">
                <Label>Max igrača</Label>
                <Input name="max_players" type="number" defaultValue={editCourt?.max_players ?? ""} />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="is_indoor" value="true" defaultChecked={editCourt?.is_indoor} className="rounded" />
                Zatvoreni teren
              </label>
              {editCourt && (
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="is_active" value="false" defaultChecked={!editCourt.is_active} className="rounded" />
                  Neaktivan
                </label>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sačuvaj
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pricing rules dialog */}
      <Dialog open={!!showPricing} onOpenChange={() => setShowPricing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cenovna pravila: {pricingCourt?.name}</DialogTitle>
          </DialogHeader>
          {pricingCourt && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Osnovna cena: {pricingCourt.price_per_hour.toLocaleString()} RSD/h
              </p>

              {pricingCourt.court_pricing_rules.length > 0 && (
                <div className="space-y-1">
                  {pricingCourt.court_pricing_rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>
                        {rule.day_of_week !== null ? DAY_LABELS[rule.day_of_week] : "Svi dani"}
                        {" · "}
                        {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                        {" · "}
                        <strong>{rule.price_per_hour.toLocaleString()} RSD</strong>
                      </span>
                      <Button variant="ghost" size="icon-xs" onClick={() => handleDeleteRule(rule.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSavePricing} className="grid gap-2 rounded-lg border p-3">
                <input type="hidden" name="courtId" value={pricingCourt.id} />
                <p className="text-sm font-medium">Novo pravilo</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Dan</Label>
                    <select name="day_of_week" className="h-8 w-full rounded-md border bg-background px-2 text-sm">
                      <option value="">Svi</option>
                      {DAY_LABELS.map((label, i) => <option key={i} value={i}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Od</Label>
                    <Input name="start_time" type="time" required className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Do</Label>
                    <Input name="end_time" type="time" required className="h-8" />
                  </div>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Cena (RSD/h)</Label>
                  <Input name="price_per_hour" type="number" required className="h-8" />
                </div>
                <Button size="sm" type="submit" disabled={pricingLoading}>
                  {pricingLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                  Dodaj
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
