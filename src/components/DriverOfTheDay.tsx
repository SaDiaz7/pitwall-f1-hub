import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Crown } from "lucide-react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { TeamStripe } from "@/components/TeamStripe";
import { Button } from "@/components/ui/button";
import { useDriverOfTheDay } from "@/hooks/useDriverOfTheDay";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { supabase } from "@/integrations/supabase/client";
import { getDriverStandings, type RaceResult } from "@/lib/f1";
import { cn } from "@/lib/utils";

interface DriverInfo {
  name: string;
  wikiUrl: string | null;
}

interface SeasonRankRow {
  driver_id: string;
  awards: number;
  total_votes: number;
}

// Barra de resultado: el ancho se anima al aparecer.
function ResultBar({
  name,
  votes,
  percent,
  mine,
  winner,
}: {
  name: string;
  votes: number;
  percent: number;
  mine: boolean;
  winner: boolean;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-semibold">
          {winner && <Crown className="h-4 w-4 shrink-0 text-amber-400" />}
          <span className="truncate">{name}</span>
          {mine && <span className="shrink-0 text-xs font-normal text-primary">(tu voto)</span>}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {votes} {votes === 1 ? "voto" : "votos"} · {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            winner ? "bg-gradient-primary" : "bg-primary/60",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </li>
  );
}

export function DriverOfTheDay({ season, round, results }: { season: number; round: number; results: RaceResult[] }) {
  const { userId, status, myVote, totalVotes, tally, loading, error, vote } = useDriverOfTheDay(season, round);

  const [info, setInfo] = useState<Record<string, DriverInfo>>({});
  const [ranking, setRanking] = useState<SeasonRankRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Nombres y links de Wikipedia de los pilotos de la temporada (para las fotos).
  useEffect(() => {
    let cancelled = false;
    getDriverStandings()
      .then((drivers) => {
        if (cancelled) return;
        const next: Record<string, DriverInfo> = {};
        for (const driver of drivers) next[driver.id] = { name: driver.name, wikiUrl: driver.wikiUrl ?? null };
        setInfo(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Ranking de la temporada: en cuántas votaciones cerradas ganó cada piloto.
  useEffect(() => {
    let cancelled = false;
    supabase.rpc("dotd_season_ranking", { p_season: season }).then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError) {
        console.error("Ranking del piloto del día:", rpcError);
        return;
      }
      setRanking((data ?? []) as unknown as SeasonRankRow[]);
    });
    return () => {
      cancelled = true;
    };
  }, [season]);

  const photos = useDriverPhotos(results.map((r) => ({ id: r.driverId, wikiUrl: info[r.driverId]?.wikiUrl ?? null })));

  const nameOf = (driverId: string) =>
    results.find((r) => r.driverId === driverId)?.name ?? info[driverId]?.name ?? driverId;

  const onVote = async () => {
    if (!selected) return;
    setSending(true);
    setMessage(null);
    const result = await vote(selected);
    setSending(false);
    if (result.ok) {
      setChanging(false);
      setSelected(null);
    } else {
      setMessage(result.message);
    }
  };

  const startChanging = () => {
    setSelected(myVote);
    setMessage(null);
    setChanging(true);
  };

  const showResults = status === "closed" || (status === "open" && myVote !== null && !changing);
  const showVote = status === "open" && Boolean(userId) && (myVote === null || changing);

  const rows = tally.map((entry, index) => ({
    id: entry.driver_id,
    name: nameOf(entry.driver_id),
    votes: entry.votes,
    percent: totalVotes > 0 ? Math.round((entry.votes * 100) / totalVotes) : 0,
    winner: status === "closed" && index === 0,
  }));

  let body: React.ReactNode;

  if (loading) {
    body = <p className="text-sm text-muted-foreground">Cargando la votación…</p>;
  } else if (error) {
    body = <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>;
  } else if (status === "not_open") {
    body = (
      <p className="text-sm text-muted-foreground">
        La votación abre unas horas después de que termine la carrera. ¡Volvé en un rato!
      </p>
    );
  } else if (showVote) {
    body =
      results.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pudimos cargar los pilotos de la carrera.</p>
      ) : (
        <div className="space-y-3">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <li key={r.driverId}>
                <button
                  type="button"
                  onClick={() => setSelected(r.driverId)}
                  aria-pressed={selected === r.driverId}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border bg-background/40 p-2 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 active:scale-95",
                    selected === r.driverId && "border-primary bg-primary/15",
                  )}
                >
                  <DriverAvatar name={r.name} photo={photos[r.driverId] ?? null} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TeamStripe teamName={r.teamName} className="h-3" />
                      <span className="truncate">{r.teamName}</span>
                    </span>
                  </span>
                  {selected === r.driverId && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onVote}
              disabled={!selected || sending}
              className="bg-gradient-primary font-semibold"
            >
              {sending ? "Votando…" : selected ? `Votar por ${nameOf(selected)}` : "Elegí un piloto"}
            </Button>
            {changing && (
              <Button type="button" variant="ghost" onClick={() => setChanging(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      );
  } else if (status === "open" && !userId) {
    body = (
      <p className="text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Iniciá sesión
        </Link>{" "}
        para votar al piloto del día.
      </p>
    );
  } else if (showResults) {
    body =
      rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nadie votó en esta carrera.</p>
      ) : (
        <div className="space-y-3">
          {status === "closed" && rows[0] && (
            <p className="font-display text-2xl font-bold uppercase">
              Piloto del día: <span className="text-primary">{rows[0].name}</span>
            </p>
          )}
          <ul className="space-y-3">
            {rows.slice(0, 8).map((row) => (
              <ResultBar
                key={row.id}
                name={row.name}
                votes={row.votes}
                percent={row.percent}
                mine={row.id === myVote}
                winner={row.winner}
              />
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            {totalVotes} {totalVotes === 1 ? "voto" : "votos"} en total.
            {status === "open" && " La votación sigue abierta: todavía podés cambiar tu voto."}
          </p>
          {status === "open" && (
            <Button type="button" variant="outline" size="sm" onClick={startChanging}>
              Cambiar mi voto
            </Button>
          )}
        </div>
      );
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-bold uppercase">Piloto del día</h2>
        <p className="text-sm text-muted-foreground">
          Votá al mejor piloto de la carrera. La votación dura 72 horas después de la largada y el resultado se ve
          cuando votás.
        </p>
      </div>

      {message && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{message}</p>}

      {body}

      {ranking.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Más premiados de la temporada
          </h3>
          <ol className="space-y-1 text-sm">
            {ranking.slice(0, 5).map((row, index) => (
              <li key={row.driver_id} className="flex items-center gap-2">
                <span className="w-5 text-right font-display font-bold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{nameOf(row.driver_id)}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.awards} {row.awards === 1 ? "vez" : "veces"}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}