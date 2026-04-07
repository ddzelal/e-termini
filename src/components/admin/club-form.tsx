"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AMENITY_LABELS, DAY_LABELS } from "@/lib/constants";
import { createClub, updateClub } from "@/lib/admin-actions";
import type { Database } from "@/lib/database.types";

type AmenityType = Database["public"]["Enums"]["amenity_type"];

interface WorkingHour {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface ClubData {
  id?: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_street: string;
  address_city: string;
  address_postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_published: boolean;
}

interface ClubFormProps {
  club?: ClubData;
  workingHours?: WorkingHour[];
  amenities?: AmenityType[];
  isAdmin?: boolean;
}

const ALL_AMENITIES = Object.keys(AMENITY_LABELS) as AmenityType[];

const DEFAULT_HOURS: WorkingHour[] = Array.from({ length: 7 }, (_, i) => ({
  day_of_week: i,
  open_time: "08:00",
  close_time: "22:00",
  is_closed: false,
}));

export function ClubForm({ club, workingHours, amenities, isAdmin = false }: ClubFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(club?.is_published ?? false);
  const [hours, setHours] = useState<WorkingHour[]>(
    workingHours?.length ? workingHours.sort((a, b) => a.day_of_week - b.day_of_week) : DEFAULT_HOURS
  );
  const [selectedAmenities, setSelectedAmenities] = useState<Set<AmenityType>>(
    new Set(amenities ?? [])
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("is_published", published.toString());

    // Add working hours
    hours.forEach((h) => {
      formData.set(`wh_open_${h.day_of_week}`, h.open_time);
      formData.set(`wh_close_${h.day_of_week}`, h.close_time);
      formData.set(`wh_closed_${h.day_of_week}`, h.is_closed.toString());
    });

    // Add amenities
    selectedAmenities.forEach((a) => formData.append("amenities", a));

    const result = club?.id
      ? await updateClub(club.id, formData)
      : await createClub(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (!club?.id) {
      // createClub redirects
    } else {
      setLoading(false);
      router.refresh();
    }
  }

  function toggleAmenity(amenity: AmenityType) {
    const next = new Set(selectedAmenities);
    if (next.has(amenity)) next.delete(amenity);
    else next.add(amenity);
    setSelectedAmenities(next);
  }

  function updateHour(day: number, field: keyof WorkingHour, value: string | boolean) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, [field]: value } : h))
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Osnovni podaci</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="name">Naziv kluba *</Label>
            <Input id="name" name="name" required defaultValue={club?.name ?? ""} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="description">Opis</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="rounded-md border bg-background px-3 py-2 text-sm"
              defaultValue={club?.description ?? ""}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={club?.phone ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={club?.email ?? ""} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="website">Veb sajt</Label>
            <Input id="website" name="website" defaultValue={club?.website ?? ""} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Address */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Adresa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="address_street">Ulica *</Label>
            <Input id="address_street" name="address_street" required defaultValue={club?.address_street ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address_city">Grad *</Label>
            <Input id="address_city" name="address_city" required defaultValue={club?.address_city ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address_postal_code">Poštanski broj</Label>
            <Input id="address_postal_code" name="address_postal_code" defaultValue={club?.address_postal_code ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="latitude">Latitude</Label>
            <Input id="latitude" name="latitude" type="number" step="any" defaultValue={club?.latitude ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="longitude">Longitude</Label>
            <Input id="longitude" name="longitude" type="number" step="any" defaultValue={club?.longitude ?? ""} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Working hours */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Radno vreme</h2>
        <div className="space-y-2">
          {hours.map((h) => (
            <div key={h.day_of_week} className="flex items-center gap-3">
              <span className="w-24 text-sm">{DAY_LABELS[h.day_of_week]}</span>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => updateHour(h.day_of_week, "is_closed", e.target.checked)}
                  className="rounded"
                />
                Zatvoreno
              </label>
              {!h.is_closed && (
                <>
                  <Input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => updateHour(h.day_of_week, "open_time", e.target.value)}
                    className="w-28 h-8"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => updateHour(h.day_of_week, "close_time", e.target.value)}
                    className="w-28 h-8"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Amenities */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pogodnosti</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_AMENITIES.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                selectedAmenities.has(amenity)
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {AMENITY_LABELS[amenity]}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Publish — only admin can toggle */}
      {isAdmin && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded"
            />
            Objavljen (vidljiv igračima)
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {club?.id ? "Sačuvaj izmene" : "Kreiraj klub"}
      </Button>
    </form>
  );
}
