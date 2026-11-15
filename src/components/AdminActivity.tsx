import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { RefreshCw } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { CountryFlag } from "@/components/CountryFlag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type RoundCount = { season: number; round: number; count: number };

type Activity = {
  total_users: number;
  active_today: number;
  game_players_today: number;
  game_solved_today: number;
  free_packs_today: number;
  circuit_packs_today: number;
  dotd_votes_today: number;
  predictions_today: number;
  last_prediction: RoundCount | null;
  last_dotd: RoundCount | null;
  daily: { day: string; game: number; packs: number; votes: number }[];
};

type ActiveUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country: string | null;
  played: boolean;
  solved: boolean;
  claimed_pack: boolean;
  voted: boolean;
  predicted: boolean;
};

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
      {children}
    </span>
  );
}

export function AdminActivity() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [activityRes, usersRes] = await Promise.all([
      supabase.rpc("admin_activity"),
      supabase.rpc("admin_active_today"),
    ]);

    if (activityRes.error || usersRes.error) {
      console.error("Panel de actividad:", activityRes.error ?? usersRes.error);
      setError("No pudimos cargar los datos. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setActivity(activityRes.data as unknown as Activity);
    setUsers((usersRes.data ?? []) as unknown as ActiveUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = activity?.total_users ?? 0;
  const percentOfUsers = (value: number) => (total > 0 ? Math.min(100, (value / total) * 100) : 0);
  const maxGame = activity ? Math.max(1, ...activity.daily.map((item) => item.game)) : 1;

  const rows = activity
    ? [
        { label: "Jugaron el juego diario", value: activity.game_players_today },
        { label: "Lo resolvieron", value: activity.game_solved_today },
        { label: "Sobres gratis abiertos", value: activity.free_packs_today },
        { label: "Sobres del juego abiertos", value: activity.circuit_packs_today },
        { label: "Votos del Piloto del día", value: activity.dotd_votes_today },
        { label: "Predicciones guardadas", value: activity.predictions_today },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Actividad</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Qué se hizo hoy en la web. Las barras muestran qué porcentaje de todos los usuarios lo hizo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading && !activity && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      )}

      {activity && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            <div className="fade-up rounded-xl border bg-card p-4" style={stagger(0)}>
              <p className="font-display text-3xl font-bold leading-none tabular-nums">{activity.active_today}</p>
              <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">Activos hoy</p>
            </div>
            <div className="fade-up rounded-xl border bg-card p-4" style={stagger(1)}>
              <p className="font-display text-3xl font-bold leading-none tabular-nums">{activity.total_users}</p>
              <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">Usuarios totales</p>
            </div>
            {activity.last_prediction && (
              <div className="fade-up rounded-xl border bg-card p-4" style={stagger(2)}>
                <p className="font-display text-3xl font-bold leading-none tabular-nums">
                  {activity.last_prediction.count}
                </p>
                <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  Predicciones · ronda {activity.last_prediction.round}
                </p>
              </div>
            )}
            {activity.last_dotd && (
              <div className="fade-up rounded-xl border bg-card p-4" style={stagger(3)}>
                <p className="font-display text-3xl font-bold leading-none tabular-nums">
                  {activity.last_dotd.count}
                </p>
                <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  Votos Piloto del día · ronda {activity.last_dotd.round}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(4)}>
              <h3 className="text-sm font-bold uppercase tracking-wider">Hoy</h3>
              <ul className="mt-3 space-y-3">
                {rows.map((row, index) => (
                  <li key={row.label} className="fade-up" style={stagger(index)}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span>{row.label}</span>
                      <span className="font-semibold tabular-nums">{row.value}</span>
                    </div>
                    <AnimatedBar percent={percentOfUsers(row.value)} className="mt-1 h-2" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(5)}>
              <h3 className="text-sm font-bold uppercase tracking-wider">Últimos 7 días</h3>
              <ul className="mt-3 space-y-3">
                {activity.daily.map((item, index) => (
                  <li key={item.day} className="fade-up" style={stagger(index)}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="tabular-nums">
                        {item.day.slice(8)}/{item.day.slice(5, 7)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.game} jugaron · {item.packs} sobres · {item.votes} votos
                      </span>
                    </div>
                    <AnimatedBar percent={(item.game / maxGame) * 100} className="mt-1 h-2" />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">Quién estuvo activo hoy</h3>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hubo actividad hoy.</p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
                {users.map((user, index) => (
                  <div
                    key={user.id}
                    className="fade-up flex items-center gap-3 rounded-xl border bg-card p-3"
                    style={stagger(index)}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
                      <AvatarFallback className="bg-gradient-primary font-display text-primary-foreground">
                        {getInitials(user.display_name || user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {user.country && <CountryFlag code={user.country} className="h-3.5 shrink-0" />}
                        <span className="truncate">{user.display_name || user.username || "Sin nombre"}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {user.played && <Chip>{user.solved ? "Juego ✓" : "Juego"}</Chip>}
                        {user.claimed_pack && <Chip>Sobre</Chip>}
                        {user.voted && <Chip>Votó</Chip>}
                        {user.predicted && <Chip>Predijo</Chip>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}