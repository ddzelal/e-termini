"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/lib/admin-actions";

interface User {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  player: "Igrač",
  club_owner: "Vlasnik",
  admin: "Admin",
};

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  club_owner: "secondary",
  player: "outline",
};

export function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  async function handleRoleChange(userId: string, role: string) {
    setLoading(userId);
    await updateUserRole(userId, role as "player" | "club_owner" | "admin");
    setLoading(null);
    router.refresh();
  }

  return (
    <>
      {/* Filter */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {[
          { value: "all", label: "Svi" },
          { value: "player", label: "Igrači" },
          { value: "club_owner", label: "Vlasnici" },
          { value: "admin", label: "Admini" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.full_name}</span>
                <Badge variant={ROLE_VARIANTS[user.role] ?? "outline"}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {user.phone && `${user.phone} · `}
                Registrovan: {format(parseISO(user.created_at), "dd.MM.yyyy")}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading === user.id && <Loader2 className="h-4 w-4 animate-spin" />}
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                disabled={loading === user.id}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                <option value="player">Igrač</option>
                <option value="club_owner">Vlasnik</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground">Nema korisnika</p>
          </div>
        )}
      </div>
    </>
  );
}
