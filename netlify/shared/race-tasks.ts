import { translateRaceName } from "../../src/lib/race-names";
import { adminClient, type AdminClient } from "./admin";

const JOLPICA_URL = "https://api.jolpi.ca/ergast/f1";
const RACE_DURATION_MS = 3 * 60 * 60 * 1000; // se espera 3 horas desde la largada
const WINDOW_MS = 72 * 60 * 60 * 1000; // y se reintenta durante 72 horas

interface SessionRaw {
  date: string;
  time?: string;
}

interface ScheduleResponse {
  MRData: {
    RaceTable: {
      Races?: {
        season: string;
        round: string;
        raceName: string;
        date: string;
        time?: string;
        Qualifying?: SessionRaw;
        SprintQualifying?: SessionRaw;
        SprintShootout?: SessionRaw;
      }[];
    };
  };
}

interface RaceResult {
  position: string;
  positionText: string;
  status: string;
  Driver: { driverId: string; givenName: string; familyName: string };
}

interface ResultsResponse {
  MRData: { RaceTable: { Races?: { Results?: RaceResult[] }[] } };
}

export interface TaskSummary {
  calendarSynced: number | null;
  scoredRaces: number[];
  driverResultsQueued: number;
  remindersQueued: number;
  errors: string[];
}

async function jolpica<T>(path: string): Promise<T> {
  const res = await fetch(`${JOLPICA_URL}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "PitWall/1.0 (https://pitwallff1.netlify.app)" },
  });
  if (!res.ok) throw new Error(`Jolpica respondió con estado ${res.status} en ${path}`);
  return (await res.json()) as T;
}

function sessionIso(session: SessionRaw | undefined): string | null {
  if (!session?.time) return null;
  const date = new Date(`${session.date}T${session.time}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchResults(season: number, round: number): Promise<RaceResult[]> {
  const json = await jolpica<ResultsResponse>(`/${season}/${round}/results/?limit=100`);
  return json.MRData.RaceTable.Races?.[0]?.Results ?? [];
}

// 1. Copia el calendario a la base de datos, con la hora de cierre de cada carrera.
async function syncCalendar(supabase: AdminClient): Promise<number> {
  const json = await jolpica<ScheduleResponse>("/current/?limit=100");

  const rows = (json.MRData.RaceTable.Races ?? []).map((race) => {
    // Las predicciones cierran cuando empieza la primera clasificación del fin de semana.
    const qualifying = [sessionIso(race.Qualifying), sessionIso(race.SprintQualifying), sessionIso(race.SprintShootout)]
      .filter((iso): iso is string => iso !== null)
      .sort();

    return {
      season: Number(race.season),
      round: Number(race.round),
      name: translateRaceName(race.raceName),
      qualifying_at: qualifying[0] ?? null,
      race_at: new Date(`${race.date}T${race.time ?? "00:00:00Z"}`).toISOString(),
    };
  });

  const { error } = await supabase.from("race_events").upsert(rows, { onConflict: "season,round" });
  if (error) throw new Error(`No se pudo sincronizar el calendario: ${error.message}`);
  return rows.length;
}

// 2. Calcula los puntos de las carreras que ya terminaron y todavía no se puntuaron.
async function scoreFinishedRaces(supabase: AdminClient): Promise<number[]> {
  const now = Date.now();

  const { data, error } = await supabase
    .from("race_events")
    .select("season, round")
    .is("scored_at", null)
    .lt("race_at", new Date(now - RACE_DURATION_MS).toISOString())
    .gt("race_at", new Date(now - WINDOW_MS).toISOString());

  if (error) throw new Error(`No se pudieron leer las carreras: ${error.message}`);

  const scored: number[] = [];

  for (const race of data ?? []) {
    const results = await fetchResults(race.season, race.round);

    const topTen = results
      .filter((r) => {
        const position = Number(r.position);
        return position >= 1 && position <= 10;
      })
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((r) => r.Driver.driverId);

    // Si la API todavía no publicó los 10 primeros, se reintenta en la próxima vuelta.
    if (topTen.length !== 10) continue;

    const { error: rpcError } = await supabase.rpc("score_race_system", {
      p_season: race.season,
      p_round: race.round,
      p_results: topTen,
    });
    if (rpcError) {
      throw new Error(`No se pudieron calcular los puntos de la ronda ${race.round}: ${rpcError.message}`);
    }

    scored.push(race.round);
  }

  return scored;
}

// 3. Deja en la cola el aviso "tu piloto favorito terminó en tal posición".
async function queueDriverResults(supabase: AdminClient): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: races, error } = await supabase
    .from("race_events")
    .select("season, round, name")
    .not("scored_at", "is", null)
    .is("driver_results_queued_at", null)
    .gt("race_at", since);

  if (error) throw new Error(`No se pudieron leer las carreras puntuadas: ${error.message}`);
  if (!races || races.length === 0) return 0;

  // Solo se arma el aviso para quienes tienen al menos un dispositivo activado.
  const { data: devices, error: devicesError } = await supabase.from("push_subscriptions").select("user_id");
  if (devicesError) throw new Error(`No se pudieron leer los dispositivos: ${devicesError.message}`);
  const subscribed = new Set((devices ?? []).map((device) => device.user_id as string));

  let queued = 0;

  for (const race of races) {
    const results = await fetchResults(race.season, race.round);
    if (results.length === 0) continue; // se reintenta en la próxima vuelta

    const byDriver = new Map(results.map((result) => [result.Driver.driverId, result]));

    const { data: favorites, error: favoritesError } = await supabase
      .from("favorite_drivers")
      .select("user_id, driver_id")
      .in("driver_id", [...byDriver.keys()]);
    if (favoritesError) throw new Error(`No se pudieron leer los favoritos: ${favoritesError.message}`);

    const rows = (favorites ?? []).flatMap((favorite) => {
      const result = byDriver.get(favorite.driver_id as string);
      if (!result || !subscribed.has(favorite.user_id as string)) return [];

      return [
        {
          user_id: favorite.user_id as string,
          type: "driver_result",
          payload: {
            season: race.season,
            round: race.round,
            race: race.name,
            driver_id: result.Driver.driverId,
            driver_name: `${result.Driver.givenName} ${result.Driver.familyName}`,
            position: Number(result.position),
            position_text: result.positionText,
            status: result.status,
          },
          dedupe_key: `driver:${race.season}:${race.round}:${result.Driver.driverId}`,
        },
      ];
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("notification_outbox")
        .upsert(rows, { onConflict: "user_id,type,dedupe_key", ignoreDuplicates: true });
      if (insertError) throw new Error(`No se pudieron guardar los avisos de resultados: ${insertError.message}`);
    }

    const { error: markError } = await supabase
      .from("race_events")
      .update({ driver_results_queued_at: new Date().toISOString() })
      .eq("season", race.season)
      .eq("round", race.round);
    if (markError) throw new Error(`No se pudo marcar la ronda ${race.round}: ${markError.message}`);

    queued += rows.length;
  }

  return queued;
}

// 4. Recordatorios de cierre de predicciones (la lógica vive en la base de datos).
async function queueReminders(supabase: AdminClient): Promise<number> {
  const { data, error } = await supabase.rpc("queue_prediction_reminders");
  if (error) throw new Error(`No se pudieron preparar los recordatorios: ${error.message}`);
  return typeof data === "number" ? data : 0;
}

export async function runRaceTasks(options: { forceSync: boolean }): Promise<TaskSummary> {
  const supabase = adminClient();
  const summary: TaskSummary = {
    calendarSynced: null,
    scoredRaces: [],
    driverResultsQueued: 0,
    remindersQueued: 0,
    errors: [],
  };

  // Una tarea que falla no frena a las demás.
  const attempt = async (label: string, task: () => Promise<void>) => {
    try {
      await task();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`${label}: ${message}`);
      console.error(`Error en la tarea "${label}":`, message);
    }
  };

  // El calendario se sincroniza una vez por hora (en la corrida de los minutos 0 al 4), o a pedido.
  if (options.forceSync || new Date().getUTCMinutes() < 5) {
    await attempt("sincronizar calendario", async () => {
      summary.calendarSynced = await syncCalendar(supabase);
    });
  }

  await attempt("calcular puntos", async () => {
    summary.scoredRaces = await scoreFinishedRaces(supabase);
  });

  await attempt("avisos de resultados", async () => {
    summary.driverResultsQueued = await queueDriverResults(supabase);
  });

  await attempt("recordatorios", async () => {
    summary.remindersQueued = await queueReminders(supabase);
  });

  return summary;
}