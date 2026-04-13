"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Map as MapIcon, MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MapPicker = dynamic(() => import("./map-picker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-xl border border-border/60 bg-muted/20 text-sm text-muted-foreground dark:border-white/15">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Učitavanje mape...
    </div>
  ),
});

export interface AddressValue {
  street: string;
  city: string;
  country: string;
  countryCode: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  displayName: string;
}

interface PhotonProperties {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  postcode?: string;
  type?: string;
  osm_value?: string;
}

interface PhotonFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

interface AddressAutocompleteProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  onPendingChange?: (pending: boolean) => void;
}

const PHOTON_ENDPOINT = "https://photon.komoot.io/api";

function buildStreet(props: PhotonProperties): string {
  const street = props.street ?? props.name ?? "";
  const housenumber = props.housenumber ?? "";
  return [street, housenumber].filter(Boolean).join(" ").trim();
}

function buildCity(props: PhotonProperties): string {
  return props.city ?? props.town ?? props.village ?? props.county ?? "";
}

function propsToValue(
  props: PhotonProperties,
  lat: number,
  lng: number
): AddressValue {
  const street = buildStreet(props);
  const city = buildCity(props);
  const displayParts = [
    street || props.name,
    city,
    props.state,
    props.country,
  ].filter(Boolean);

  return {
    street: street || props.name || "",
    city,
    country: props.country ?? "",
    countryCode: props.countrycode ? props.countrycode.toUpperCase() : null,
    postalCode: props.postcode ?? null,
    latitude: lat,
    longitude: lng,
    displayName: displayParts.join(", "),
  };
}

function featureToValue(feature: PhotonFeature): AddressValue {
  const [lng, lat] = feature.geometry.coordinates;
  return propsToValue(feature.properties, lat, lng);
}

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<AddressValue> {
  try {
    const res = await fetch(
      `${PHOTON_ENDPOINT}/reverse?lat=${lat}&lon=${lng}&lang=en`
    );
    if (!res.ok) throw new Error("reverse failed");
    const data: PhotonResponse = await res.json();
    if (data.features?.[0]) {
      return propsToValue(data.features[0].properties, lat, lng);
    }
  } catch {
    // fall through to coords-only payload
  }
  return {
    street: "",
    city: "",
    country: "",
    countryCode: null,
    postalCode: null,
    latitude: lat,
    longitude: lng,
    displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

function featureLabel(feature: PhotonFeature): string {
  const props = feature.properties;
  const street = buildStreet(props);
  const city = buildCity(props);
  return [street || props.name, city, props.state, props.country]
    .filter(Boolean)
    .join(", ");
}

type Mode = "search" | "map";

export function AddressAutocomplete({
  value,
  onChange,
  onPendingChange,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value.displayName ?? "");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("search");
  const [reverseLoading, setReverseLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (mode !== "search") return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(
          query
        )}&lang=en&limit=6`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Photon error");
        const data: PhotonResponse = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, mode]);

  async function handleMapPick(lat: number, lng: number) {
    // Optimistic: immediately set coordinates so they're never lost
    onChange({
      ...value,
      latitude: lat,
      longitude: lng,
      displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    });
    setReverseLoading(true);
    onPendingChange?.(true);
    const next = await reverseGeocode(lat, lng);
    setReverseLoading(false);
    onPendingChange?.(false);
    onChange(next);
    setQuery(next.displayName);
  }

  function handleSelect(feature: PhotonFeature) {
    const next = featureToValue(feature);
    setQuery(next.displayName);
    onChange(next);
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    onChange({
      street: "",
      city: "",
      country: "",
      countryCode: null,
      postalCode: null,
      latitude: null,
      longitude: null,
      displayName: "",
    });
  }

  function updateManualField<K extends keyof AddressValue>(
    field: K,
    val: AddressValue[K]
  ) {
    onChange({ ...value, [field]: val });
  }

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg border border-border/50 p-1 dark:border-white/10">
        {(
          [
            { id: "search", label: "Pretraga", icon: Search },
            { id: "map", label: "Izaberi na mapi", icon: MapIcon },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Search input */}
      {mode === "search" && (
        <div ref={containerRef} className="relative">
          <Label htmlFor="address-search" className="mb-1.5 block">
            Adresa kluba *
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="address-search"
              type="text"
              placeholder="npr. Knez Mihailova 1, Beograd"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              autoComplete="off"
              className="pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Obriši"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {open && (loading || results.length > 0) && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-lg dark:border-white/15">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Pretraga...
                </div>
              )}
              {!loading &&
                results.map((feature, idx) => {
                  const label = featureLabel(feature);
                  return (
                    <button
                      key={`${feature.geometry.coordinates.join(",")}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(feature)}
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1">{label}</span>
                    </button>
                  );
                })}
            </div>
          )}

          <p className="mt-1.5 text-xs text-muted-foreground">
            Počnite da kucate adresu i izaberite predlog. Sva polja će se popuniti automatski.
          </p>
        </div>
      )}

      {/* Map picker */}
      {mode === "map" && (
        <div className="space-y-2">
          <MapPicker
            latitude={value.latitude}
            longitude={value.longitude}
            onChange={handleMapPick}
          />
          <p className="text-xs text-muted-foreground">
            {reverseLoading
              ? "Učitavam podatke o lokaciji..."
              : "Kliknite na mapu da postavite tačnu lokaciju kluba. Marker možete povući da fino podesite poziciju."}
          </p>
        </div>
      )}

      {/* Editable address fields — always visible, always editable */}
      <div className="rounded-xl border border-border/50 p-4 dark:border-white/10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detalji adrese
          </span>
          {reverseLoading ? (
            <span className="flex items-center gap-1 text-[10px] text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Učitavam podatke o lokaciji...
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              Sva polja možete ručno doraditi
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1 sm:col-span-2">
              <Label htmlFor="addr-street" className="text-xs">
                Ulica i broj
              </Label>
              <Input
                id="addr-street"
                value={value.street}
                onChange={(e) => updateManualField("street", e.target.value)}
                disabled={reverseLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-city" className="text-xs">
                Grad
              </Label>
              <Input
                id="addr-city"
                value={value.city}
                onChange={(e) => updateManualField("city", e.target.value)}
                disabled={reverseLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-postal" className="text-xs">
                Poštanski broj
              </Label>
              <Input
                id="addr-postal"
                value={value.postalCode ?? ""}
                onChange={(e) =>
                  updateManualField("postalCode", e.target.value || null)
                }
                disabled={reverseLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-country" className="text-xs">
                Država
              </Label>
              <Input
                id="addr-country"
                value={value.country}
                onChange={(e) => updateManualField("country", e.target.value)}
                disabled={reverseLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-cc" className="text-xs">
                Country code
              </Label>
              <Input
                id="addr-cc"
                value={value.countryCode ?? ""}
                onChange={(e) =>
                  updateManualField(
                    "countryCode",
                    e.target.value ? e.target.value.toUpperCase() : null
                  )
                }
                maxLength={2}
                disabled={reverseLoading}
                placeholder="RS"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-lat" className="text-xs">
                Latitude
              </Label>
              <Input
                id="addr-lat"
                type="number"
                step="any"
                value={value.latitude ?? ""}
                onChange={(e) =>
                  updateManualField(
                    "latitude",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                disabled={reverseLoading}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="addr-lng" className="text-xs">
                Longitude
              </Label>
              <Input
                id="addr-lng"
                type="number"
                step="any"
                value={value.longitude ?? ""}
                onChange={(e) =>
                  updateManualField(
                    "longitude",
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                disabled={reverseLoading}
              />
            </div>
          </div>

        {value.latitude !== null && value.longitude !== null && (
          <p className="mt-2 text-xs text-muted-foreground">
            📍 {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)} — vremenska zona se postavlja automatski iz koordinata.
          </p>
        )}
      </div>

      {/* Hidden inputs for FormData */}
      <input type="hidden" name="address_street" value={value.street} />
      <input type="hidden" name="address_city" value={value.city} />
      <input type="hidden" name="address_country" value={value.country} />
      <input
        type="hidden"
        name="address_country_code"
        value={value.countryCode ?? ""}
      />
      <input
        type="hidden"
        name="address_postal_code"
        value={value.postalCode ?? ""}
      />
      <input
        type="hidden"
        name="latitude"
        value={value.latitude !== null ? String(value.latitude) : ""}
      />
      <input
        type="hidden"
        name="longitude"
        value={value.longitude !== null ? String(value.longitude) : ""}
      />
    </div>
  );
}
