import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { GAME_LABELS, WEEK_ORDER } from "@/lib/games";
import { cn } from "@/lib/utils";

type Schedule = {
  today_weekday: number;
  games: string[];
  week: { weekday: number; game: string }[];
};

type Status = { type: "ok" | "error"; text: string } | null;

const WEEKDAY_NAMES: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export function AdminSchedule() {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_get_schedule");
    if (error) {
      console.error("Calendario de juegos:", error);
      setLoadError("No pudimos cargar el calendario. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }
    setSchedule(data as unknown as Schedule);
    setLoadError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onChange = async (weekday: number, game: string) => {
    setSaving(true);
    setStatus(null);

    const { error } = await supabase.rpc("admin_set_schedule", { p_weekday: weekday, p_game: game });
    setSaving(false);

    if (error) {
      console.error("Cambiar calendario:", error);
      setStatus({
        type: "error",
        text: error.message.includes("Hoy ya hay partidas")
          ? "Hoy ya hay partidas jugadas: cambiá otro día o esperá a mañana."
          : "No pudimos guardar el cambio. Revisá la consola para ver el detalle.",
      });
      return;
    }

    setStatus({ type: "ok", text: "Calendario actualizado." });
    await load();
  };

  const byDay = new Map((schedule?.week ?? []).map((item) => [item.weekday, item.game]));
  const counts = new Map<string, number>();
  for (const game of byDay.values()) counts.set(game, (counts.get(game) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold uppercase">Calendario de juegos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Qué juego toca cada día de la semana. Para el día de hoy solo se puede cambiar si todavía nadie jugó.
        </p>
      </div>

      {status && (
        <p
          className={cn(
            "rounded-md p-2 text-sm",
            status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {status.text}
        </p>
      )}

      {loadError && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{loadError}</p>}

      {loading && <div className="skeleton h-40 w-full" />}

      {schedule && (
        <>
          <div className="flex flex-wrap gap-2">
            {schedule.games.map((game) => (
              <span key={game} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">
                {GAME_LABELS[game] ?? game}: {counts.get(game) ?? 0} {(counts.get(game) ?? 0) === 1 ? "día" : "días"}{" "}
                por semana
              </span>
            ))}
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {WEEK_ORDER.map((weekday, index) => {
              const current = byDay.get(weekday);
              const isToday = weekday === schedule.today_weekday;

              return (
                <div
                  key={weekday}
                  className={cn("fade-up space-y-2 rounded-xl border bg-card p-3", isToday && "border-primary")}
                  style={stagger(index)}
                >
                  <p className="text-sm font-bold uppercase">
                    {WEEKDAY_NAMES[weekday] ?? weekday}
                    {isToday && <span className="ml-2 text-xs text-primary">hoy</span>}
                  </p>
                  <div className="grid gap-2">
                    {schedule.games.map((game) => (
                      <Button
                        key={game}
                        type="button"
                        size="sm"
                        variant={current === game ? "default" : "outline"}
                        disabled={saving}
                        onClick={() => {
                          if (current !== game) void onChange(weekday, game);
                        }}
                        className="text-xs transition-transform active:scale-95"
                      >
                        {GAME_LABELS[game] ?? game}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}