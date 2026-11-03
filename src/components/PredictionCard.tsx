import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Countdown } from "@/components/Countdown";
import type { PredictionRow, RaceEvent } from "@/hooks/usePredictions";
import { MAX_POINTS } from "@/lib/predictions";
import type { Driver, GrandPrix } from "@/lib/types";

interface PredictionCardProps {
  gp: GrandPrix;
  event: RaceEvent;
  prediction: PredictionRow | undefined;
  drivers: Driver[];
}

export function PredictionCard({ gp, event, prediction, drivers }: PredictionCardProps) {
  const [now, setNow] = useState(() => Date.now());

  // Revisa cada tanto si ya cerraron las predicciones, sin recargar la página.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const deadline = event.qualifying_at;
  const deadlineMs = deadline ? new Date(deadline).getTime() : null;
  const open = event.scored_at === null && deadlineMs !== null && now < deadlineMs;

  let headline: string;
  let body: string;
  let cta: string;

  if (deadlineMs === null) {
    headline = "Predicciones próximamente";
    body = "Todavía no está definido el horario de cierre de este Gran Premio.";
    cta = "Ver predicciones";
  } else if (open && !prediction) {
    headline = "Todavía no hiciste tu predicción";
    body = `Elegí tu top 10 del ${gp.name} antes de que empiece la clasificación. Podés sumar hasta ${MAX_POINTS} puntos.`;
    cta = "Hacer mi predicción";
  } else if (open) {
    headline = "Tu predicción está lista";
    body = "Si cambiás de idea, podés editarla hasta que empiece la clasificación.";
    cta = "Editar mi predicción";
  } else if (prediction) {
    headline = "Predicciones cerradas";
    body = "Tu predicción ya está en juego. Los puntos se reparten cuando termina la carrera.";
    cta = "Ver mi predicción";
  } else {
    headline = "Esta vez te la perdiste";
    body = `Las predicciones del ${gp.name} cerraron al empezar la clasificación. ¡La próxima no te la pierdas!`;
    cta = "Ver predicciones";
  }

  const podium = prediction?.picks.slice(0, 3) ?? [];
  const nameOf = (id: string) => drivers.find((d) => d.id === id)?.name ?? id;

  return (
    <section className="relative flex h-full min-h-72 flex-col items-start justify-center overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">
        Predicciones · {gp.name}
      </p>
      <h2 className="mt-2 text-3xl font-bold uppercase italic md:text-5xl">{headline}</h2>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">{body}</p>

      {podium.length > 0 && (
        <ol className="mt-4 flex flex-wrap gap-2 text-sm">
          {podium.map((id, index) => (
            <li key={`${id}-${index}`} className="rounded-lg border bg-background/50 px-3 py-1.5">
              <span className="mr-1.5 font-display font-bold text-primary">{index + 1}.º</span>
              <span className="font-semibold">{nameOf(id)}</span>
            </li>
          ))}
        </ol>
      )}

      {open && deadline && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-muted-foreground">Cierran en</p>
          <Countdown target={deadline} />
        </div>
      )}

      <Link
        to="/predicciones"
        className="mt-5 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
      >
        {cta} →
      </Link>

      <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
    </section>
  );
}