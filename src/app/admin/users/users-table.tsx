"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Loader2, User, Phone, Calendar, Shield, Crown, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { updateUserRole } from "@/lib/admin-actions";

interface UserData {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  created_at: string;
}

const ROLE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Shield }> = {
  admin: { label: "Admin", variant: "default", icon: Shield },
  club_owner: { label: "Vlasnik", variant: "secondary", icon: Crown },
  player: { label: "Igrač", variant: "outline", icon: Users },
};

export function UsersTable({ users }: { users: UserData[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);

  const counts = {
    all: users.length,
    player: users.filter((u) => u.role === "player").length,
    club_owner: users.filter((u) => u.role === "club_owner").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  async function handleRoleChange(userId: string, role: string) {
    setLoading(userId);
    await updateUserRole(userId, role as "player" | "club_owner" | "admin");
    setLoading(null);
    router.refresh();
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-muted/50 p-1 border border-border/50 dark:border-white/10 overflow-x-auto">
        {[
          { value: "all", label: "Svi" },
          { value: "player", label: "Igrači" },
          { value: "club_owner", label: "Vlasnici" },
          { value: "admin", label: "Admini" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] ${
              filter === f.value ? "bg-primary text-primary-foreground" : "bg-muted-foreground/15"
            }`}>
              {counts[f.value as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Users list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center">
          <div className="text-3xl mb-2">👥</div>
          <p className="font-medium">Nema korisnika</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.player;
            const initials = user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isLoading = loading === user.id;

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-2xl border border-border/50 p-4 transition-all hover:bg-muted/20 dark:border-white/10"
              >
                {/* Avatar */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  user.role === "admin"
                    ? "bg-gradient-to-br from-[#059669] to-[#C8FC2C]"
                    : user.role === "club_owner"
                      ? "bg-gradient-to-br from-[#059669] to-[#34d399]"
                      : "bg-muted-foreground/30 text-foreground"
                }`}>
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{user.full_name}</span>
                    <Badge variant={roleCfg.variant} className="text-[10px] shrink-0">
                      {roleCfg.label}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(user.created_at), "dd.MM.yyyy")}
                    </span>
                  </div>
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-2 shrink-0">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={isLoading}
                    className="h-8 rounded-xl border border-border/50 bg-background px-2.5 text-xs font-medium dark:border-white/15"
                  >
                    <option value="player">Igrač</option>
                    <option value="club_owner">Vlasnik</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
