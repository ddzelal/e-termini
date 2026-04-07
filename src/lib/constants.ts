import type { Database } from "@/lib/database.types";

type SportType = Database["public"]["Enums"]["sport_type"];
type AmenityType = Database["public"]["Enums"]["amenity_type"];
type SurfaceType = Database["public"]["Enums"]["surface_type"];

export const SPORT_LABELS: Record<SportType, string> = {
  football: "Fudbal",
  basketball: "Košarka",
  tennis: "Tenis",
  padel: "Padel",
  volleyball: "Odbojka",
  handball: "Rukomet",
  futsal: "Futsal",
  other: "Ostalo",
};

export const AMENITY_LABELS: Record<AmenityType, string> = {
  parking: "Parking",
  free_parking: "Besplatan parking",
  changing_room: "Svlačionica",
  showers: "Tuševi",
  lockers: "Ormarići",
  wifi: "WiFi",
  cafeteria: "Kafeterija",
  restaurant: "Restoran",
  equipment_rental: "Iznajmljivanje opreme",
  store: "Prodavnica",
  disabled_access: "Pristup za invalide",
  lighting: "Osvetljenje",
  covered: "Pokriveno",
  air_conditioning: "Klima",
  heating: "Grejanje",
};

export const SURFACE_LABELS: Record<SurfaceType, string> = {
  grass: "Trava",
  artificial_grass: "Veštačka trava",
  concrete: "Beton",
  parquet: "Parket",
  clay: "Šljaka",
  rubber: "Guma",
  sand: "Pesak",
  other: "Ostalo",
};

export const DAY_LABELS = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];
