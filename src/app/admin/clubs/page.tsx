import Link from "next/link";
import { Plus, MapPin, Layers, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";

export default async function AdminClubsPage() {
  const supabase = await createClient();

  const { data: clubs } = await supabase
    .from("clubs")
    .select(`
      id, name, slug, address_city, is_published, created_at,
      owner:profiles!clubs_owner_id_fkey(full_name),
      courts(id)
    `)
    .order("name");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BlurFade>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Klubovi</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {clubs?.length ?? 0} klubova na platformi
            </p>
          </div>
          <Link
            href="/admin/clubs/new"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#0ea87a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Novi klub
          </Link>
        </div>
      </BlurFade>

      <BlurFade delay={0.05}>
        <div className="space-y-2">
          {clubs?.map((club) => (
            <Link
              key={club.id}
              href={`/admin/clubs/${club.id}/edit`}
              className="flex items-center justify-between rounded-2xl border border-border/50 p-4 transition-all hover:border-primary/20 hover:bg-muted/20 hover:shadow-sm dark:border-white/10"
            >
              <div className="flex items-center gap-3.5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${
                  club.is_published
                    ? "bg-gradient-to-br from-[#059669] to-[#34d399]"
                    : "bg-muted-foreground/30"
                }`}>
                  {club.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{club.name}</span>
                    <Badge
                      variant={club.is_published ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {club.is_published ? "Objavljen" : "Nacrt"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {club.address_city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {club.courts?.length ?? 0} terena
                    </span>
                    {club.owner && (
                      <span className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        {club.owner.full_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {(!clubs || clubs.length === 0) && (
            <div className="rounded-2xl border border-dashed py-16 text-center">
              <div className="text-3xl mb-2">🏟️</div>
              <p className="font-medium">Nema klubova</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Kreiraj prvi klub da počneš
              </p>
            </div>
          )}
        </div>
      </BlurFade>
    </div>
  );
}
