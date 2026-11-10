import type { LucideIcon } from "lucide-react";
import type { Tier } from "@/lib/badges";
import { cn } from "@/lib/utils";

const HEXAGON = "M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z";

const ICON_COLOR: Record<Tier, string> = {
  0: "text-zinc-400",
  1: "text-amber-50",
  2: "text-slate-900",
  3: "text-amber-950",
};

// Degradados de cada nivel. Se dibujan una sola vez por sección y las medallas los reutilizan.
export function MedalDefs() {
  const stops: { id: string; from: string; to: string }[] = [
    { id: "pw-medal-0", from: "#52525b", to: "#27272a" },
    { id: "pw-medal-1", from: "#fcd9b0", to: "#b45309" },
    { id: "pw-medal-in-1", from: "#d97706", to: "#92400e" },
    { id: "pw-medal-2", from: "#f8fafc", to: "#94a3b8" },
    { id: "pw-medal-in-2", from: "#cbd5e1", to: "#64748b" },
    { id: "pw-medal-3", from: "#fef3c7", to: "#d97706" },
    { id: "pw-medal-in-3", from: "#fbbf24", to: "#b45309" },
  ];

  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        {stops.map((stop) => (
          <linearGradient key={stop.id} id={stop.id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={stop.from} />
            <stop offset="1" stopColor={stop.to} />
          </linearGradient>
        ))}
      </defs>
    </svg>
  );
}

export function BadgeMedal({
  tier,
  icon: Icon,
  className,
}: {
  tier: Tier;
  icon: LucideIcon;
  className?: string | undefined;
}) {
  const inner = tier === 0 ? "pw-medal-0" : `pw-medal-in-${tier}`;

  return (
    <span className={cn("relative inline-flex h-16 w-16 items-center justify-center", className)}>
      {tier === 3 && (
        <span aria-hidden="true" className="trophy-halo absolute inset-1 rounded-full bg-amber-300/30 blur-xl" />
      )}
      <svg viewBox="0 0 100 100" className={cn("relative h-full w-full", tier === 0 && "opacity-50")} aria-hidden="true">
        <path d={HEXAGON} fill={`url(#pw-medal-${tier})`} />
        <path
          d={HEXAGON}
          transform="translate(50 50) scale(0.78) translate(-50 -50)"
          fill={`url(#${inner})`}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1.5"
        />
        {tier === 3 && (
          <>
            <circle cx="18" cy="22" r="2.2" fill="#fff7d6" className="trophy-sparkle" />
            <circle cx="84" cy="30" r="1.8" fill="#fff7d6" className="trophy-sparkle" style={{ animationDelay: "1s" }} />
            <circle cx="78" cy="82" r="2" fill="#fff7d6" className="trophy-sparkle" style={{ animationDelay: "2s" }} />
          </>
        )}
      </svg>
      <Icon className={cn("absolute h-7 w-7", ICON_COLOR[tier])} strokeWidth={2.25} />
    </span>
  );
}