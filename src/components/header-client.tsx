"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Calendar,
  Heart,
  LayoutDashboard,
  Shield,
  Search,
  X,
  Menu,
  User,
  Building2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { BorderBeam } from "@/components/ui/border-beam";
import { ThemeToggle } from "@/components/theme-toggle";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Keyboard shortcut: Cmd/Ctrl+K for search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/clubs?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router]
  );

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/50 bg-background/80 backdrop-blur-2xl"
            : "bg-transparent backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          {/* Logo — ne diraj */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#059669] to-[#C8FC2C] shadow-md shadow-emerald-500/25 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/40 group-hover:scale-105">
              <span className="text-sm font-extrabold text-white leading-none">e</span>
            </div>
            <span className="text-lg font-extrabold tracking-tight">termini</span>
          </Link>

          {/* Desktop: single nav link */}
          <nav className="hidden md:flex items-center">
            <Link
              href="/clubs"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Klubovi
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop: search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="group/search hidden md:flex items-center gap-2.5 h-9 w-60 rounded-xl border border-border bg-muted/50 px-3.5 text-sm transition-all duration-200 hover:border-primary/40 hover:bg-muted/80 hover:shadow-sm hover:shadow-primary/5 dark:border-white/15 dark:bg-white/[0.06] dark:hover:border-primary/40 dark:hover:bg-white/10"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover/search:text-primary" />
            <span className="flex-1 text-left text-muted-foreground">Pretraži...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded-md border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex dark:border-white/15 dark:bg-white/10 dark:text-white/50">
              ⌘K
            </kbd>
          </button>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground hover:bg-muted md:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <ThemeToggle />

            {user && profile ? (
              /* === LOGGED IN: Avatar dropdown === */
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 py-1 pl-1 pr-2.5 transition-colors hover:bg-muted/70 outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#059669] to-[#34d399] text-xs font-bold text-white">
                    {initials}
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{profile.role === "club_owner" ? "Vlasnik kluba" : profile.role === "admin" ? "Administrator" : "Igrač"}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/bookings")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Moje rezervacije
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/favorites")}>
                    <Heart className="mr-2 h-4 w-4" />
                    Omiljeni klubovi
                  </DropdownMenuItem>
                  {(profile.role === "admin" || profile.role === "club_owner") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      {profile.role === "admin" && (
                        <DropdownMenuItem onClick={() => router.push("/admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin panel
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      const form = document.createElement("form");
                      form.action = "/";
                      form.method = "POST";
                      document.body.appendChild(form);
                      // Use server action via fetch
                      logout();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Odjava
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* === NOT LOGGED IN === */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="hidden sm:inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-muted"
                >
                  Prijava
                </button>
                <ShimmerButton
                  onClick={() => setAuthOpen(true)}
                  background="linear-gradient(135deg, #059669, #0ea87a)"
                  shimmerColor="#C8FC2C"
                  shimmerSize="0.05em"
                  borderRadius="10px"
                  className="h-9 px-4 text-sm font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Registracija
                </ShimmerButton>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:text-foreground hover:bg-muted md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* === MOBILE MENU === */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl md:hidden"
            >
              <div className="p-4 space-y-1">
                <Link
                  href="/clubs"
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Building2 className="mr-2.5 h-4 w-4" />
                  Klubovi
                </Link>
                {user && (
                  <>
                    <Link
                      href="/bookings"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Calendar className="mr-2.5 h-4 w-4" />
                      Rezervacije
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Heart className="mr-2.5 h-4 w-4" />
                      Omiljeni
                    </Link>
                  </>
                )}
                {user && profile && (profile.role === "admin" || profile.role === "club_owner") && (
                  <Link
                    href={profile.role === "admin" ? "/admin" : "/dashboard"}
                    className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {profile.role === "admin" ? (
                      <Shield className="mr-2.5 h-4 w-4" />
                    ) : (
                      <LayoutDashboard className="mr-2.5 h-4 w-4" />
                    )}
                    {profile.role === "admin" ? "Admin" : "Dashboard"}
                  </Link>
                )}
                <div className="pt-3 border-t border-border/30">
                  {!user && (
                    <ShimmerButton
                      onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                      background="linear-gradient(135deg, #059669, #0ea87a)"
                      shimmerColor="#C8FC2C"
                      borderRadius="10px"
                      className="h-10 w-full text-sm font-semibold"
                    >
                      Registracija
                    </ShimmerButton>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* === SEARCH OVERLAY (outside header for proper fixed positioning) === */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
              className="fixed left-1/2 top-24 z-[70] w-full max-w-xl -translate-x-1/2 px-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl shadow-black/25 dark:border-border/30 dark:bg-card">
                <ShineBorder
                  shineColor={["#059669", "#C8FC2C", "#059669"]}
                  borderWidth={1.5}
                  duration={8}
                />
                <form onSubmit={handleSearch}>
                  <div className="flex items-center gap-3 px-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Pretraži klubove po imenu ili gradu..."
                      className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/40"
                      autoFocus
                    />
                    <kbd className="hidden sm:flex h-6 items-center rounded-lg border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground/60 dark:border-border/50 dark:bg-muted/50">
                      ESC
                    </kbd>
                  </div>
                </form>
                <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground/50">
                    Pretraži po nazivu kluba ili gradu
                  </p>
                  <p className="text-xs text-muted-foreground/40 hidden sm:block">
                    Enter za pretragu
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
