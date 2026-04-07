"use client";

import { DotPattern } from "@/components/ui/dot-pattern";

export function ClubHeroBackground() {
  return (
    <DotPattern
      glow
      width={24}
      height={24}
      cr={1.2}
      className="text-primary/25 [mask-image:radial-gradient(600px_circle_at_50%_50%,white,transparent)] dark:text-primary/15"
    />
  );
}
