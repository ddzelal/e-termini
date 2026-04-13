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
import {
  AddressAutocomplete,
  type AddressValue,
} from "./address-autocomplete";
import type { Database } from "@/lib/database.types";

type AmenityType = Database["public"]["Enums"]["amenity_type"];
type BookingMode = Database["public"]["Enums"]["booking_mode_type"];

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
  address_country?: string;
  address_country_code?: string | null;
  address_postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_published: boolean;
  booking_mode?: BookingMode;
  min_booking_lead_minutes?: number;
  max_booking_advance_days?: number;
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
  const [bookingMode, setBookingMode] = useState<BookingMode>(
    club?.booking_mode ?? "owner_only"
  );
  const [addressPending, setAddressPending] = useState(false);
  const allOpen24h = hours.every(
    (h) =>
      !h.is_closed && h.open_time === "00:00" && h.close_time === "23:59"
  );
  const [address, setAddress] = useState<AddressValue>(() => {
    const street = club?.address_street ?? "";
    const city = club?.address_city ?? "";
    const country = club?.address_country ?? "";
    const displayName =
      street || city || country
        ? [street, city, country].filter(Boolean).join(", ")
        : "";
    return {
      street,
      city,
      country,
      countryCode: club?.address_country_code ?? null,
      postalCode: club?.address_postal_code ?? null,
      latitude: club?.latitude ?? null,
      longitude: club?.longitude ?? null,
      displayName,
    };
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (addressPending) {
      setError("Sačekajte da se adresa učita pre nego što sačuvate.");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("is_published", published.toString());
    formData.set("booking_mode", bookingMode);

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

  function toggle24h(enabled: boolean) {
    if (enabled) {
      setHours((prev) =>
        prev.map((h) => ({
          ...h,
          open_time: "00:00",
          close_time: "23:59",
          is_closed: false,
        }))
      );
    } else {
      setHours((prev) =>
        prev.map((h) => ({
          ...h,
          open_time: "08:00",
          close_time: "22:00",
          is_closed: false,
        }))
      );
    }
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

      {/* Address — autocomplete + manual fallback */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Adresa</h2>
        <AddressAutocomplete
          value={address}
          onChange={setAddress}
          onPendingChange={setAddressPending}
        />
      </section>

      <Separator />

      {/* Working hours */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Radno vreme</h2>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={allOpen24h}
              onChange={(e) => toggle24h(e.target.checked)}
              className="rounded"
            />
            Otvoreno 24h, 7 dana
          </label>
        </div>
        {allOpen24h ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium">Klub je otvoren 24h, svaki dan u nedelji.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Isključite checkbox iznad da biste podesili pojedinačne dane.
            </p>
          </div>
        ) : (
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
        )}
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

      {/* Booking policy */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Režim rezervacije</h2>
        <p className="text-sm text-muted-foreground">
          Određuje kako igrači mogu da rezervišu termine u ovom klubu.
        </p>

        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              bookingMode === "owner_only"
                ? "border-primary bg-primary/[0.04]"
                : "border-border/50 hover:bg-muted/30 dark:border-white/10"
            }`}
          >
            <input
              type="radio"
              name="booking_mode_radio"
              value="owner_only"
              checked={bookingMode === "owner_only"}
              onChange={() => setBookingMode("owner_only")}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">Telefonom (preko vlasnika)</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Igrači vide dostupnost, ali klikom na slot dobijaju vaš broj telefona. Vi unosite rezervacije ručno sa dashboard-a.
              </div>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              bookingMode === "self_service"
                ? "border-primary bg-primary/[0.04]"
                : "border-border/50 hover:bg-muted/30 dark:border-white/10"
            }`}
          >
            <input
              type="radio"
              name="booking_mode_radio"
              value="self_service"
              checked={bookingMode === "self_service"}
              onChange={() => setBookingMode("self_service")}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">Samoposluga</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Igrači rezervišu termine direktno kroz aplikaciju. Plaćanje se i dalje obavlja na licu mesta.
              </div>
            </div>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="min_booking_lead_minutes">
              Minimum unapred (min)
            </Label>
            <Input
              id="min_booking_lead_minutes"
              name="min_booking_lead_minutes"
              type="number"
              min="0"
              max="1440"
              defaultValue={club?.min_booking_lead_minutes ?? 30}
            />
            <p className="text-xs text-muted-foreground">
              Najranije koliko pre termina se može rezervisati.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="max_booking_advance_days">
              Maksimum unapred (dana)
            </Label>
            <Input
              id="max_booking_advance_days"
              name="max_booking_advance_days"
              type="number"
              min="1"
              max="365"
              defaultValue={club?.max_booking_advance_days ?? 30}
            />
            <p className="text-xs text-muted-foreground">
              Koliko dana unapred se može rezervisati.
            </p>
          </div>
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

      <Button
        type="submit"
        disabled={loading || addressPending}
        className="w-full sm:w-auto"
      >
        {(loading || addressPending) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {addressPending
          ? "Učitavam adresu..."
          : club?.id
            ? "Sačuvaj izmene"
            : "Kreiraj klub"}
      </Button>
    </form>
  );
}
