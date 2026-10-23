import { useState } from "react";
import { useFavorites } from "@/hooks/useFavorites";
import {
  analyzeTitle,
  getContenders,
  getRemaining,
  type Remaining,
  type TitleAnalysis,
  type TitleStatus,
} from "@/lib/championship";
import type { Driver, GrandPrix } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TeamStripe } from "@/components/TeamStripe";

const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";

const STATUS_LABEL: Record<TitleStatus, string> = {
  champion: "Campeón matemático",
  leader: "Líder",
  alive: "Con chances",
  tiebreak: "Solo por desempate",
  eliminated: "Eliminado",
};

const STATUS_STYLE: Record<TitleStatus, string> = {
  champion: "bg-gradient-primary text-primary-foreground",
  leader: "bg-primary/20 text-primary",
  alive: "bg-secondary text-foreground",
  tiebreak: "bg-secondary text-muted-foreground",
  eliminated: "bg-destructive/15 text-destructive",
};

function describe(a: TitleAnalysis, r: Remaining): string[] {
  const name = a.driver.name;
  const rival = a.rival.name;

  switch (a.status) {
    case "champion":
      return [
        `${name} es campeón matemático: su ventaja de ${a.difference} pts sobre ${rival} supera los ${r.maxPoints} pts que quedan en juego.`,
      ];

    case "leader": {
      const swing = r.swingIfOneTwo;
      const outcome =
        a.difference > swing
          ? "todavía seguiría adelante"
          : a.difference === swing
            ? "quedarían igualados en puntos"
            : "lo pasaría";
      return [
        `${name} lidera con ${a.difference} pts sobre ${rival}.`,
        `Se asegura el título cuando esa ventaja supere los ${r.maxPoints} pts que quedan en juego.`,
        `Si ${rival} gana todo lo que queda y ${name} termina 2.º en cada carrera, le descuenta ${swing} pts: ${outcome}.`,
      ];
    }

    case "alive":
      return [
        `${name} está a ${a.difference} pts de ${rival} y puede llegar a ${a.maxFinal} pts como máximo.`,
        a.extraNeeded === 0
          ? `Si gana todas las carreras y sprints que quedan, se consagra aunque ${rival} termine 2.º en todas.`
          : `Aun ganando todo, necesita ayuda: ${rival} tendría que sumar ${a.extraNeeded} pts menos de lo que sumaría terminando 2.º en cada carrera (por abandonos o peores resultados).`,
      ];

    case "tiebreak":
      return [
        `${name} solo podría igualar a ${rival} en ${a.maxFinal} pts, y dependería del desempate por victorias.`,
      ];

    case "eliminated":
      return [
        `${name} está matemáticamente eliminado: aun ganando todo llegaría a ${a.maxFinal} pts y ${rival} ya tiene ${a.rival.points}.`,
      ];
  }
}

export function TitleCalculator({ drivers, schedule }: { drivers: Driver[]; schedule: GrandPrix[] }) {
  const { favorites } = useFavorites();
  const [selectedId, setSelectedId] = useState("");

  if (drivers.length < 2 || schedule.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        No pudimos cargar los datos necesarios (pilotos y calendario) para calcular el título.
      </div>
    );
  }

  const remaining = getRemaining(schedule);

  // Por defecto: tu primer favorito que corre hoy; si no hay, el 2.º del campeonato.
  const defaultDriver = drivers.find((d) => favorites.includes(d.id)) ?? drivers[1];
  const selected = drivers.find((d) => d.id === selectedId) ?? defaultDriver;
  const analysis = selected ? analyzeTitle(drivers, selected.id, remaining) : null;
  const { alive, eliminated } = getContenders(drivers, remaining);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        {remaining.races === 0 ? (
          <p className="text-sm">La temporada terminó: no quedan carreras por disputar.</p>
        ) : (
          <p className="text-sm">
            Quedan <span className="font-bold">{remaining.races}</span> {remaining.races === 1 ? "carrera" : "carreras"}{" "}
            y <span className="font-bold">{remaining.sprints}</span> {remaining.sprints === 1 ? "sprint" : "sprints"}:
            hasta <span className="font-bold">{remaining.maxPoints} pts</span> en juego para cada piloto.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <label className="block max-w-sm space-y-1.5 text-sm font-medium">
          <span>Piloto</span>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className={SELECT_CLASS}
          >
            {drivers.map((d, index) => (
              <option key={d.id} value={d.id}>
                P{index + 1} · {d.name} · {d.points} pts
              </option>
            ))}
          </select>
        </label>

        {analysis && (
          <div className="space-y-3">
            <span
              className={cn(
                "inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                STATUS_STYLE[analysis.status],
              )}
            >
              {STATUS_LABEL[analysis.status]}
            </span>
            {describe(analysis, remaining).map((line) => (
              <p key={line} className="text-sm leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <h3 className="text-lg font-bold uppercase">Quiénes pueden ser campeones</h3>
        <p className="text-sm text-muted-foreground">
          {alive.length} {alive.length === 1 ? "piloto sigue" : "pilotos siguen"} con chances matemáticas
          {eliminated > 0 ? `; ${eliminated} ya ${eliminated === 1 ? "está eliminado" : "están eliminados"}` : ""}.
        </p>
        <ul className="space-y-1.5">
          {alive.map((c) => (
            <li key={c.driver.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <TeamStripe teamId={c.driver.teamId} teamName={c.driver.teamName} className="h-5" />
                <span className="font-display font-bold">P{c.position}</span>
                <span className="truncate font-semibold">{c.driver.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                hasta {c.maxFinal} pts{c.gap > 0 ? ` · a ${c.gap} del líder` : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Es un cálculo de puntos: no tiene en cuenta desempates por victorias, sanciones ni descalificaciones. Usa 25
        puntos por victoria en carrera y 8 por victoria en sprint (2.º puesto: 18 y 7), sin punto por vuelta rápida.
      </p>
    </div>
  );
}