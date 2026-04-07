"use client";

import Link from "next/link";
import { Search, Calendar, Trophy } from "lucide-react";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { BlurFade } from "@/components/ui/blur-fade";

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center gap-6 overflow-hidden px-4 py-28 text-center md:py-36">
      {/* Animated grid background */}
      <AnimatedGridPattern
        className="absolute inset-0 -z-10 fill-primary/8 stroke-primary/8 [mask-image:radial-gradient(500px_circle_at_center,white,transparent)]"
        numSquares={40}
        maxOpacity={0.3}
        duration={3}
      />

      <BlurFade delay={0}>
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Pronađi i rezerviši
          <br />
          <AnimatedGradientText
            colorFrom="#059669"
            colorTo="#C8FC2C"
            speed={1}
            className="text-4xl font-bold md:text-6xl"
          >
            sportski teren
          </AnimatedGradientText>
        </h1>
      </BlurFade>

      <BlurFade delay={0.15}>
        <p className="max-w-md text-lg text-muted-foreground">
          Pretraži klubove u tvom gradu, izaberi termin i rezerviši — brzo i
          jednostavno.
        </p>
      </BlurFade>

      <BlurFade delay={0.3}>
        <Link href="/clubs">
          <ShimmerButton
            background="oklch(0.55 0.18 155)"
            shimmerColor="#C8FC2C"
            className="h-11 px-8 text-base font-medium"
          >
            Pretraži klubove
          </ShimmerButton>
        </Link>
      </BlurFade>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Search, title: "Pronađi", desc: "Pretraži klubove po gradu, sportu ili imenu." },
    { icon: Calendar, title: "Rezerviši", desc: "Izaberi slobodan termin i potvrdi rezervaciju." },
    { icon: Trophy, title: "Igraj", desc: "Dođi u klub, plati na licu mesta i uživaj u igri." },
  ];

  return (
    <section className="border-t bg-muted/30 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <BlurFade inView>
          <h2 className="mb-12 text-center text-2xl font-semibold">
            Kako funkcioniše
          </h2>
        </BlurFade>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <BlurFade key={step.title} delay={0.1 * i} inView>
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
