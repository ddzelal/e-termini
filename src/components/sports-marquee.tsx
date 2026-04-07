import { Marquee } from "@/components/ui/marquee";
import { SPORT_LABELS } from "@/lib/constants";

const sports = Object.entries(SPORT_LABELS).filter(([key]) => key !== "other");

const sportIcons: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  padel: "🏓",
  volleyball: "🏐",
  handball: "🤾",
  futsal: "⚽",
};

export function SportsMarquee() {
  return (
    <section className="border-t py-6 overflow-hidden">
      <Marquee pauseOnHover className="[--duration:25s]">
        {sports.map(([key, label]) => (
          <div
            key={key}
            className="mx-4 flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-sm"
          >
            <span className="text-lg">{sportIcons[key]}</span>
            {label}
          </div>
        ))}
      </Marquee>
    </section>
  );
}
