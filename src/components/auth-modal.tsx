"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { loginWithEmail, registerWithEmail } from "@/lib/auth-actions";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result =
      mode === "login"
        ? await loginWithEmail(formData)
        : await registerWithEmail(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onOpenChange(false);
      router.refresh();
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {mode === "login" ? "Dobrodošli nazad" : "Kreirajte nalog"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "login"
              ? "Prijavite se da rezervišete termine"
              : "Registrujte se da biste počeli sa rezervacijama"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 pt-2">
          {/* Google button */}
          <Button
            variant="outline"
            className="h-11 w-full gap-3 font-medium"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Nastavi sa Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover px-3 text-xs text-muted-foreground">
              ili
            </span>
          </div>

          {/* Email form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleEmailSubmit}
              className="grid gap-3"
            >
              {mode === "register" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="fullName">Ime i prezime</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Marko Marković"
                    required
                    className="h-10"
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vas@email.com"
                  required
                  className="h-10"
                />
              </div>

              {mode === "register" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="phone">Telefon (opciono)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+381 60 123 4567"
                    className="h-10"
                  />
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-10"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="h-10 w-full"
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "login" ? "Prijavi se" : "Registruj se"}
              </Button>
            </motion.form>
          </AnimatePresence>

          {/* Switch mode */}
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Nemate nalog?" : "Već imate nalog?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Registrujte se" : "Prijavite se"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
