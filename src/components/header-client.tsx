"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Calendar, Heart, LayoutDashboard, Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth-modal";
import { logout } from "@/lib/auth-actions";
import type { Database } from "@/lib/database.types";

type UserRole = Database["public"]["Enums"]["user_role"];

interface HeaderClientProps {
  user: { id: string } | null;
  profile: { full_name: string; role: UserRole } | null;
}

export function HeaderClient({ user, profile }: HeaderClientProps) {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            e-termini
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/clubs"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Klubovi
            </Link>

            {user && profile ? (
              <div className="flex items-center gap-1">
                {(profile.role === "admin" || profile.role === "club_owner") && (
                  <Link
                    href={profile.role === "admin" ? "/admin" : "/dashboard"}
                    className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  >
                    {profile.role === "admin" ? (
                      <Shield className="h-4 w-4" />
                    ) : (
                      <LayoutDashboard className="h-4 w-4" />
                    )}
                  </Link>
                )}

                <Link
                  href="/bookings"
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                >
                  <Calendar className="h-4 w-4" />
                </Link>

                <Link
                  href="/favorites"
                  className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                >
                  <Heart className="h-4 w-4" />
                </Link>

                <span className="ml-1 hidden text-sm font-medium sm:inline">
                  {profile.full_name}
                </span>

                <form action={logout}>
                  <Button variant="ghost" size="icon-sm" type="submit">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            ) : (
              <Button size="sm" onClick={() => setAuthOpen(true)}>
                Prijava
              </Button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
