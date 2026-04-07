import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://e-termini.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: clubs } = await supabase
    .from("clubs")
    .select("slug, updated_at")
    .eq("is_published", true);

  const clubPages: MetadataRoute.Sitemap = (clubs ?? []).map((club) => ({
    url: `${SITE_URL}/clubs/${club.slug}`,
    lastModified: club.updated_at,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/clubs`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...clubPages,
  ];
}
