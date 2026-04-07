"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

interface Club {
  id: string;
  name: string;
}

export function ClubSelector({ clubs, currentId }: { clubs: Club[]; currentId: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={currentId}
        onChange={(e) => router.push(`/dashboard/club?id=${e.target.value}`)}
        className="h-9 rounded-xl border border-border/50 bg-background px-3 text-sm font-medium dark:border-white/15"
      >
        {clubs.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
