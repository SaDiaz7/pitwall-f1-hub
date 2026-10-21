import { useEffect, useState } from "react";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(() => Date.now());

  // Se actualiza cada segundo.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = new Date(target).getTime() - now;

  if (diff <= 0) {
    return <p className="font-display text-xl font-semibold">¡La carrera ya empezó!</p>;
  }

  const units: [string, string][] = [
    [pad(Math.floor(diff / DAY)), "días"],
    [pad(Math.floor((diff % DAY) / HOUR)), "hs"],
    [pad(Math.floor((diff % HOUR) / MINUTE)), "min"],
    [pad(Math.floor((diff % MINUTE) / 1000)), "seg"],
  ];

  return (
    <div className="flex gap-2" role="timer" aria-label="Tiempo hasta la carrera">
      {units.map(([value, label]) => (
        <div key={label} className="min-w-14 rounded-lg bg-background/60 px-3 py-2 text-center">
          <div className="font-display text-2xl font-bold tabular-nums leading-none">{value}</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}