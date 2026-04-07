"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toggleFavorite } from "@/lib/favorite-actions";
import { AuthModal } from "@/components/auth-modal";

interface FavoriteButtonProps {
  clubId: string;
  isFavorited: boolean;
  isAuthenticated: boolean;
}

export function FavoriteButton({ clubId, isFavorited, isAuthenticated }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(isFavorited);
  const [animating, setAnimating] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  async function handleClick() {
    if (!isAuthenticated) {
      setAuthOpen(true);
      return;
    }

    setAnimating(true);
    const result = await toggleFavorite(clubId);
    if ("favorited" in result) {
      setFavorited(!!result.favorited);
    }
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
          favorited
            ? "border-red-200 bg-red-50 text-red-500 dark:border-red-900/30 dark:bg-red-950/20"
            : "border-border/50 bg-muted/30 text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:border-white/10 dark:hover:border-red-900/30 dark:hover:bg-red-950/20"
        }`}
      >
        <motion.div animate={animating ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
          <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
        </motion.div>
      </button>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
