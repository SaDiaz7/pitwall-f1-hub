import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RaceEvent } from "@/hooks/usePredictions";
import { supabase } from "@/integrations/supabase/client";
import { getBonusSuggestions, getDriverStandings, getRaceResults, getSchedule } from "@/lib/f1";
import {
  BONUS_QUESTIONS,
  DNF_OPTIONS,
  YES_NO_OPTIONS,
  bonusOf,
  predictionDeadline,
  raceStartOf,
  seasonOf,
  type BonusAnswers,
  type BonusKey,
} from "@/lib/predictions";
import type { Driver, GrandPrix } from "@/lib/types";

type Status = { type: "ok" | "error"; text: string } | null;

interface Review {
  round: number;
  loading: boolean;
  values: BonusAnswers;
  notes: string[];
}

const SELECT_CLASS = "h-9 w-full rounded-md border bg-card px-2 text-sm";

export function PredictionsAdmin() {
  const season = new Date().getFullYear();
  const [schedule, setSchedule] = useState<GrandPrix[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [events, setEvents] = useState<Record<number, RaceEvent>>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [syncing, setSyncing] = useState(false);
  const [busyRound, setBusyRound] = useState<number | null>(null);
  const [awarding, setAwarding] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const load = useCallback(async () => {
    try {
      const [races, eventsResult, standings] = await Promise.all([
        getSchedule(),
        supabase.from("race_events").select("*").eq("season", season),
        getDriverStandings().catch((): Driver[] => []),
      ]);
      setSchedule(races);
      setDrivers(standings);
      setEvents(Object.fromEntries((eventsResult.data ?? []).map((event) => [event.round, event])));
    } catch (error) {
      console.error("Cargar herramientas de predicciones:", error);
      setStatus({ type: "error", text: "No pudimos cargar el calendario." });
    }
    setLoading(false);
  }, [season]);

  useEffect(() => {
    load();
  }, [load]);

  // Copia el calendario a la base de datos (con la hora de cierre de cada carrera).
  const sync = async () => {
    setStatus(null);
    setSyncing(true);

    const rows = schedule.map((gp) => ({
      season: seasonOf(gp),
      round: gp.round,
      name: gp.name,
      qualifying_at: predictionDeadline(gp),
      race_at: raceStartOf(gp) ?? `${gp.date}T00:00:00Z`,
    }));

    const { error } = await supabase.from("race_events").upsert(rows, { onConflict: "season,round" });
    setSyncing(false);

    if (error) {
      console.error("Sincronizar calendario:", error);
      setStatus({ type: "error", text: "No pudimos sincronizar el calendario." });
      return;
    }

    await load();
    setStatus({ type: "ok", text: `Calendario sincronizado (${rows.length} carreras).` });
  };

  // Abre el panel de revisión de una carrera con las sugerencias automáticas.
  const openReview = async (gp: GrandPrix) => {
    setStatus(null);
    setReview({ round: gp.round, loading: true, values: {}, notes: [] });

    // Si la carrera ya se calculó, lo que se usó la vez anterior manda sobre las sugerencias.
    const saved = bonusOf(events[gp.round]?.bonus_results);

    try {
      const suggestion = await getBonusSuggestions({ data: { round: gp.round } });
      setReview({
        round: gp.round,
        loading: false,
        values: { ...suggestion.values, ...saved },
        notes: suggestion.notes,
      });
    } catch (error) {
      console.error("Sugerencias de extras:", error);
      setReview({
        round: gp.round,
        loading: false,
        values: saved,
        notes: ["No pudimos traer las sugerencias automáticas. Completá los resultados a mano."],
      });
    }
  };

  const setValue = (key: BonusKey, value: string) =>
    setReview((current) => {
      if (!current) return current;
      const values = { ...current.values };
      if (value === "") delete values[key];
      else values[key] = value;
      return { ...current, values };
    });

  // Trae el resultado oficial y calcula los puntos (top 10 + extras) de todas las predicciones de esa carrera.
  const score = async (gp: GrandPrix, bonus: BonusAnswers) => {
    setStatus(null);
    setBusyRound(gp.round);

    try {
      const results = await getRaceResults({ data: { round: gp.round } });
      const topTen = results
        .filter((r) => r.position >= 1 && r.position <= 10)
        .sort((a, b) => a.position - b.position)
        .map((r) => r.driverId);

      if (topTen.length !== 10) {
        setStatus({ type: "error", text: "La API todavía no tiene los 10 primeros de esa carrera." });
        return;
      }

      const { data, error } = await supabase.rpc("score_race", {
        p_season: seasonOf(gp),
        p_round: gp.round,
        p_results: topTen,
        p_bonus: bonus,
      });

      if (error) {
        console.error("Calcular puntos:", error);
        setStatus({ type: "error", text: "No pudimos calcular los puntos. Revisá la consola para ver el detalle." });
        return;
      }

      setReview(null);
      await load();
      setStatus({ type: "ok", text: `Puntos calculados para ${data ?? 0} predicciones de ${gp.name}.` });
    } catch (error) {
      console.error("Calcular puntos:", error);
      setStatus({ type: "error", text: "No pudimos traer el resultado de la carrera." });
    } finally {
      setBusyRound(null);
    }
  };

  // Entrega la copa de la temporada a quien ganó cada liga (se puede repetir para recalcular).
  const awardTrophies = async () => {
    if (!window.confirm(`¿Entregar los trofeos de la temporada ${season}? Si ya se entregaron, se recalculan.`)) return;
    setStatus(null);
    setAwarding(true);

    const { data, error } = await supabase.rpc("award_trophies", { p_season: season });
    setAwarding(false);

    if (error) {
      console.error("Entregar trofeos:", error);
      setStatus({ type: "error", text: "No pudimos entregar los trofeos. Revisá la consola para ver el detalle." });
      return;
    }
    setStatus({ type: "ok", text: `Trofeos entregados: ${data ?? 0}.` });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const finished = schedule.filter((gp) => gp.status === "finalizado");

  const renderField = (key: BonusKey, label: string, kind: "yesno" | "driver" | "dnf", current: string | undefined) => {
    const options =
      kind === "yesno"
        ? YES_NO_OPTIONS
        : kind === "dnf"
          ? DNF_OPTIONS
          : drivers.map((driver) => ({ value: driver.id, label: driver.name }));

    // Si el valor sugerido no está en la lista (por ejemplo, un piloto que ya no corre), lo mostramos igual.
    const extra = current && !options.some((option) => option.value === current) ? [{ value: current, label: current }] : [];

    return (
      <label key={key} className="space-y-1 text-sm">
        <span className="font-semibold">{label}</span>
        <select value={current ?? ""} onChange={(e) => setValue(key, e.target.value)} className={SELECT_CLASS}>
          <option value="">Sin dato (nadie suma)</option>
          {[...options, ...extra].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">1. Habilitar carreras</h2>
        <p className="text-sm text-muted-foreground">
          Copia el calendario a la base de datos con la hora de cierre de cada carrera. Hacelo al principio de la
          temporada y cada vez que cambie una fecha. Sin esto, nadie puede predecir.
        </p>
        <p className="text-sm">
          Carreras habilitadas: <span className="font-bold">{Object.keys(events).length}</span> de {schedule.length}.
        </p>
        <Button type="button" disabled={syncing} onClick={sync} className="bg-gradient-primary font-semibold">
          {syncing ? "Sincronizando…" : "Sincronizar calendario"}
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">2. Calcular puntos</h2>
        <p className="text-sm text-muted-foreground">
          Después de cada carrera, tocá "Revisar y calcular": se traen el resultado oficial y los datos de las
          predicciones extra. Revisá lo sugerido, corregí lo que haga falta y confirmá. Si el resultado se corrige,
          podés volver a calcular.
        </p>

        {finished.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no terminó ninguna carrera.</p>
        ) : (
          <ul className="space-y-3">
            {[...finished].reverse().map((gp) => {
              const event = events[gp.round];
              const reviewing = review?.round === gp.round;

              return (
                <li key={gp.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{gp.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {!event ? "No habilitada" : event.scored_at ? "Puntos calculados" : "Pendiente de calcular"}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!event || busyRound === gp.round || reviewing}
                      onClick={() => openReview(gp)}
                    >
                      {event?.scored_at ? "Revisar y recalcular" : "Revisar y calcular"}
                    </Button>
                  </div>

                  {reviewing && review && (
                    <div className="space-y-3 rounded-xl border bg-background/40 p-4">
                      <h3 className="font-display text-lg font-bold uppercase">Resultados de las predicciones extra</h3>

                      {review.loading ? (
                        <p className="text-sm text-muted-foreground">Trayendo los datos…</p>
                      ) : (
                        <>
                          {review.notes.length > 0 && (
                            <ul className="space-y-1 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
                              {review.notes.map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2">
                            {BONUS_QUESTIONS.map((question) =>
                              renderField(question.key, question.label, question.kind, review.values[question.key]),
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="button"
                              disabled={busyRound === gp.round}
                              onClick={() => score(gp, review.values)}
                              className="bg-gradient-primary font-semibold"
                            >
                              {busyRound === gp.round ? "Calculando…" : "Calcular puntos"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => setReview(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">3. Entregar trofeos</h2>
        <p className="text-sm text-muted-foreground">
          Hacelo cuando termine la última carrera de la temporada y estén calculados todos los puntos. Entrega la copa
          a quien ganó cada liga que tenga el mínimo de miembros (si hay empate, la comparten). Si corregís un
          resultado, podés volver a entregar y se recalcula.
        </p>
        <Button type="button" disabled={awarding} onClick={awardTrophies} className="bg-gradient-primary font-semibold">
          {awarding ? "Entregando…" : `Entregar trofeos ${season}`}
        </Button>
      </div>

      {status && (
        <p
          className={
            status.type === "ok"
              ? "rounded-md bg-success/15 p-2 text-sm text-success"
              : "rounded-md bg-destructive/15 p-2 text-sm text-destructive"
          }
        >
          {status.text}
        </p>
      )}
    </div>
  );
}