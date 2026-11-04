import type { ComponentType } from "react";
import { FounderTrophy } from "@/components/trophies/FounderTrophy";

export interface TrophyArtProps {
  year: number;
  className?: string | undefined;
}

// Cada temporada tiene su propio diseño de copa.
// Para sumar el de un año nuevo: crear el componente de esa copa y agregarlo acá.
const DESIGNS: Record<number, ComponentType<TrophyArtProps>> = {
  2026: ({ year, className }) => <FounderTrophy year={year} className={className} />,
};

const NAMES: Record<number, string> = {
  2026: "Copa del Fundador",
};

export function trophyName(year: number): string {
  return NAMES[year] ?? `Copa ${year}`;
}

export function TrophyArt({ year, className }: TrophyArtProps) {
  const Design = DESIGNS[year];
  if (Design) return <Design year={year} className={className} />;

  // Mientras un año no tenga diseño propio, usa la copa base con el año correspondiente.
  return <FounderTrophy year={year} caption={`TEMPORADA ${year}`} className={className} />;
}