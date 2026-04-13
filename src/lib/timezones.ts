const DEFAULT_TIMEZONE = "Europe/Belgrade";

const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  Serbia: "Europe/Belgrade",
  Srbija: "Europe/Belgrade",
  Croatia: "Europe/Zagreb",
  Hrvatska: "Europe/Zagreb",
  "Bosnia and Herzegovina": "Europe/Sarajevo",
  "Bosna i Hercegovina": "Europe/Sarajevo",
  Montenegro: "Europe/Podgorica",
  "Crna Gora": "Europe/Podgorica",
  "North Macedonia": "Europe/Skopje",
  "Severna Makedonija": "Europe/Skopje",
  Makedonija: "Europe/Skopje",
  Slovenia: "Europe/Ljubljana",
  Slovenija: "Europe/Ljubljana",
  Hungary: "Europe/Budapest",
  Madjarska: "Europe/Budapest",
  Bulgaria: "Europe/Sofia",
  Bugarska: "Europe/Sofia",
  Romania: "Europe/Bucharest",
  Rumunija: "Europe/Bucharest",
  Albania: "Europe/Tirane",
  Albanija: "Europe/Tirane",
  Greece: "Europe/Athens",
  Grcka: "Europe/Athens",
  Turkey: "Europe/Istanbul",
  Turska: "Europe/Istanbul",
  Austria: "Europe/Vienna",
  Austrija: "Europe/Vienna",
  Germany: "Europe/Berlin",
  Nemacka: "Europe/Berlin",
  Italy: "Europe/Rome",
  Italija: "Europe/Rome",
};

export function timezoneForCountry(country: string | null | undefined): string {
  if (!country) return DEFAULT_TIMEZONE;
  const normalized = country.trim();
  return COUNTRY_TIMEZONE_MAP[normalized] ?? DEFAULT_TIMEZONE;
}
