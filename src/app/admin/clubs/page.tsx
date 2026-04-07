import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Klubovi</h1>
        <Link
          href="/admin/clubs/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novi klub
        </Link>
      </div>

      <div className="space-y-2">
        {clubs?.map((club) => (
          <Link
            key={club.id}
            href={`/admin/clubs/${club.id}/edit`}
            className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{club.name}</span>
                <Badge variant={club.is_published ? "default" : "secondary"}>
                  {club.is_published ? "Objavljen" : "Nacrt"}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {club.address_city}
                {" · "}
                {club.courts?.length ?? 0} terena
                {club.owner && ` · Vlasnik: ${club.owner.full_name}`}
              </div>
            </div>
          </Link>
        ))}

        {(!clubs || clubs.length === 0) && (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">Nema klubova</p>
          </div>
        )}
      </div>
    </div>
  );
}
