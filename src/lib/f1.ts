import { createServerFn } from "@tanstack/react-start";
import type { Driver, GrandPrix, GrandPrixSession, Team } from "@/lib/types";

const BASE_URL = "https://api.jolpi.ca/ergast/f1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const RACE_DURATION_MS = 3 * 60 * 60 * 1000; // margen de 3 horas desde la largada

// ---------- Forma de las respuestas de Jolpica (solo los campos que usamos) ----------

interface DriverStandingRaw {
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    givenName: string;
    familyName: string;
  };
  Constructors: { constructorId: string; name: string }[];
}

interface ConstructorStandingRaw {
  points: string;
  wins: string;
  Constructor: { constructorId: string; name: string };
}

interface SessionRaw {
  date: string;
  time?: string;
}

interface RaceRaw {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { lat: string; long: string; locality: string; country: string };
  };
  FirstPractice?: SessionRaw;
  SecondPractice?: SessionRaw;
  ThirdPractice?: SessionRaw;
  SprintQualifying?: SessionRaw;
  SprintShootout?: SessionRaw;
  Sprint?: SessionRaw;
  Qualifying?: SessionRaw;
}

interface DriverStandingsResponse {
  MRData: { StandingsTable: { StandingsLists: { DriverStandings?: DriverStandingRaw[] }[] } };
}

interface ConstructorStandingsResponse {
  MRData: { StandingsTable: { StandingsLists: { ConstructorStandings?: ConstructorStandingRaw[] }[] } };
}

interface ScheduleResponse {
  MRData: { RaceTable: { Races?: RaceRaw[] } };
}

// ---------- Traducciones (si falta alguna, se muestra el texto original) ----------

const RACE_NAMES_ES: Record<string, string> = {
  "Australian Grand Prix": "GP de Australia",
  "Chinese Grand Prix": "GP de China",
  "Japanese Grand Prix": "GP de Japón",
  "Bahrain Grand Prix": "GP de Baréin",
  "Saudi Arabian Grand Prix": "GP de Arabia Saudita",
  "Miami Grand Prix": "GP de Miami",
  "Canadian Grand Prix": "GP de Canadá",
  "Monaco Grand Prix": "GP de Mónaco",
  "Spanish Grand Prix": "GP de España",
  "Austrian Grand Prix": "GP de Austria",
  "British Grand Prix": "GP de Gran Bretaña",
  "Belgian Grand Prix": "GP de Bélgica",
  "Hungarian Grand Prix": "GP de Hungría",
  "Dutch Grand Prix": "GP de Países Bajos",
  "Italian Grand Prix": "GP de Italia",
  "Azerbaijan Grand Prix": "GP de Azerbaiyán",
  "Singapore Grand Prix": "GP de Singapur",
  "United States Grand Prix": "GP de Estados Unidos",
  "Mexico City Grand Prix": "GP de México",
  "Brazilian Grand Prix": "GP de Brasil",
  "Las Vegas Grand Prix": "GP de Las Vegas",
  "Qatar Grand Prix": "GP de Qatar",
  "Abu Dhabi Grand Prix": "GP de Abu Dabi",
  "Bahrain Grand Prix in Malaysia": "GP de Baréin en Malasia",
  "Barcelona Grand Prix": "GP de Barcelona", 
};

const COUNTRIES_ES: Record<string, string> = {
  Australia: "Australia",
  China: "China",
  Japan: "Japón",
  Bahrain: "Baréin",
  "Saudi Arabia": "Arabia Saudita",
  USA: "Estados Unidos",
  Canada: "Canadá",
  Monaco: "Mónaco",
  Spain: "España",
  Austria: "Austria",
  UK: "Reino Unido",
  Belgium: "Bélgica",
  Hungary: "Hungría",
  Netherlands: "Países Bajos",
  Italy: "Italia",
  Azerbaijan: "Azerbaiyán",
  Singapore: "Singapur",
  Mexico: "México",
  Brazil: "Brasil",
  Qatar: "Catar",
  UAE: "Emiratos Árabes Unidos",
  Malaysia: "Malasia",
};

const translateRaceName = (name: string) => RACE_NAMES_ES[name] ?? name;
const translateCountry = (country: string) => COUNTRIES_ES[country] ?? country;

// ---------- Descarga con caché en memoria ----------

const cache = new Map<string, { expires: number; data: unknown }>();

async function fetchJolpica<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Jolpica respondió con estado ${res.status}`);
    }
    const json = (await res.json()) as T;
    cache.set(path, { expires: Date.now() + CACHE_TTL_MS, data: json });
    return json;
  } catch (error) {
    // Si la API falla pero tenemos datos viejos, mejor mostrar esos que nada.
    if (cached) return cached.data as T;
    throw error;
  }
}

// ---------- Funciones de servidor ----------

export const getDriverStandings = createServerFn({ method: "GET" }).handler(async (): Promise<Driver[]> => {
  const json = await fetchJolpica<DriverStandingsResponse>("/current/driverstandings/?limit=100");
  const list = json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? [];

  return list.map((entry) => {
    const team = entry.Constructors[entry.Constructors.length - 1];
    return {
      id: entry.Driver.driverId,
      name: `${entry.Driver.givenName} ${entry.Driver.familyName}`,
      number: Number(entry.Driver.permanentNumber ?? 0),
      teamId: team?.constructorId ?? "",
      teamName: team?.name ?? "—",
      points: Number(entry.points),
      wins: Number(entry.wins),
    };
  });
});

export const getConstructorStandings = createServerFn({ method: "GET" }).handler(async (): Promise<Team[]> => {
  const json = await fetchJolpica<ConstructorStandingsResponse>("/current/constructorstandings/?limit=100");
  const list = json.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];

  return list.map((entry) => ({
    id: entry.Constructor.constructorId,
    name: entry.Constructor.name,
    points: Number(entry.points),
    wins: Number(entry.wins),
  }));
});

const SESSION_LABELS = {
  FirstPractice: "Práctica libre 1",
  SecondPractice: "Práctica libre 2",
  ThirdPractice: "Práctica libre 3",
  SprintQualifying: "Clasificación sprint",
  SprintShootout: "Clasificación sprint",
  Sprint: "Sprint",
  Qualifying: "Clasificación",
} as const;

type SessionKey = keyof typeof SESSION_LABELS;
const SESSION_KEYS = Object.keys(SESSION_LABELS) as SessionKey[];

export const getSchedule = createServerFn({ method: "GET" }).handler(async (): Promise<GrandPrix[]> => {
  const json = await fetchJolpica<ScheduleResponse>("/current/?limit=100");
  const races = json.MRData.RaceTable.Races ?? [];
  const now = Date.now();

  return races.map((race) => {
    const raceStart = new Date(`${race.date}T${race.time ?? "00:00:00Z"}`);
    const finished = raceStart.getTime() + RACE_DURATION_MS < now;

    // Todas las sesiones del fin de semana, ordenadas por horario.
    const sessions: GrandPrixSession[] = [];
    for (const key of SESSION_KEYS) {
      const raw = race[key];
      if (raw?.time) {
        sessions.push({ name: SESSION_LABELS[key], start: new Date(`${raw.date}T${raw.time}`).toISOString() });
      }
    }
    if (race.time) {
      sessions.push({ name: "Carrera", start: raceStart.toISOString() });
    }
    sessions.sort((a, b) => a.start.localeCompare(b.start));

    return {
      id: `${race.season}-${race.round}`,
      round: Number(race.round),
      name: translateRaceName(race.raceName),
      circuit: race.Circuit.circuitName,
      country: translateCountry(race.Circuit.Location.country),
      date: race.date,
      status: finished ? "finalizado" : "proximo",
      circuitId: race.Circuit.circuitId,
      locality: race.Circuit.Location.locality,
      lat: Number(race.Circuit.Location.lat),
      lng: Number(race.Circuit.Location.long),
      sessions,
    };
  });
});

// ---------- Pilotos y equipos de una temporada (para etiquetar fondos de pantalla) ----------

export interface SeasonOption {
  id: string;
  name: string;
}

export interface SeasonOptions {
  drivers: SeasonOption[];
  teams: SeasonOption[];
}

interface SeasonDriversResponse {
  MRData: { DriverTable: { Drivers?: { driverId: string; givenName: string; familyName: string }[] } };
}

interface SeasonConstructorsResponse {
  MRData: { ConstructorTable: { Constructors?: { constructorId: string; name: string }[] } };
}

export const getSeasonOptions = createServerFn({ method: "GET" })
  .inputValidator((data: { year: number }) => {
    if (!Number.isInteger(data.year) || data.year < 1950 || data.year > 2100) {
      throw new Error("Año inválido");
    }
    return data;
  })
  .handler(async ({ data }): Promise<SeasonOptions> => {
    const [driversJson, teamsJson] = await Promise.all([
      fetchJolpica<SeasonDriversResponse>(`/${data.year}/drivers/?limit=100`),
      fetchJolpica<SeasonConstructorsResponse>(`/${data.year}/constructors/?limit=100`),
    ]);

    const drivers = (driversJson.MRData.DriverTable.Drivers ?? [])
      .map((d) => ({ id: d.driverId, name: `${d.givenName} ${d.familyName}` }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const teams = (teamsJson.MRData.ConstructorTable.Constructors ?? [])
      .map((t) => ({ id: t.constructorId, name: t.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { drivers, teams };
  });

  // ---------- Podios de las carreras ya corridas ----------

export interface PodiumEntry {
  position: number;
  name: string;
  teamName: string;
}

export type Podiums = Record<number, PodiumEntry[]>;

interface PodiumResponse {
  MRData: {
    RaceTable: {
      Races?: {
        round: string;
        Results?: {
          position: string;
          Driver: { givenName: string; familyName: string };
          Constructor: { name: string };
        }[];
      }[];
    };
  };
}

export const getPodiums = createServerFn({ method: "GET" }).handler(async (): Promise<Podiums> => {
  // Una consulta por puesto: así traemos 1º, 2º y 3º de todas las carreras de la temporada.
  const responses = await Promise.all(
    [1, 2, 3].map((place) => fetchJolpica<PodiumResponse>(`/current/results/${place}/?limit=100`)),
  );

  const podiums: Podiums = {};
  for (const json of responses) {
    for (const race of json.MRData.RaceTable.Races ?? []) {
      const round = Number(race.round);
      for (const result of race.Results ?? []) {
        const list = podiums[round] ?? [];
        list.push({
          position: Number(result.position),
          name: `${result.Driver.givenName} ${result.Driver.familyName}`,
          teamName: result.Constructor.name,
        });
        podiums[round] = list;
      }
    }
  }

  for (const list of Object.values(podiums)) {
    list.sort((a, b) => a.position - b.position);
  }

  return podiums;
});

// ---------- Clasificación completa de una carrera ----------

export interface RaceResult {
  position: number;
  positionText: string;
  name: string;
  teamName: string;
  grid: number;
  time: string;
  status: string;
  points: number;
}

interface RaceResultsResponse {
  MRData: {
    RaceTable: {
      Races?: {
        Results?: {
          position: string;
          positionText: string;
          points: string;
          grid: string;
          status: string;
          Time?: { time: string };
          Driver: { givenName: string; familyName: string };
          Constructor: { name: string };
        }[];
      }[];
    };
  };
}

export const getRaceResults = createServerFn({ method: "GET" })
  .inputValidator((data: { round: number }) => {
    if (!Number.isInteger(data.round) || data.round < 1 || data.round > 30) {
      throw new Error("Ronda inválida");
    }
    return data;
  })
  .handler(async ({ data }): Promise<RaceResult[]> => {
    const json = await fetchJolpica<RaceResultsResponse>(`/current/${data.round}/results/?limit=100`);
    const results = json.MRData.RaceTable.Races?.[0]?.Results ?? [];

    return results.map((r) => ({
      position: Number(r.position),
      positionText: r.positionText,
      name: `${r.Driver.givenName} ${r.Driver.familyName}`,
      teamName: r.Constructor.name,
      grid: Number(r.grid),
      time: r.Time?.time ?? "",
      status: r.status,
      points: Number(r.points),
    }));
  });

// ---------- Pronóstico del tiempo (Open-Meteo) ----------

export interface WeatherDay {
  date: string; // YYYY-MM-DD en la hora local del circuito
  code: number;
  max: number;
  min: number;
  rainChance: number | null;
  wind: number | null;
}

export interface WeatherForecast {
  timezone: string; // zona horaria del circuito
  days: WeatherDay[];
}

interface OpenMeteoResponse {
  timezone: string;
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
}

const WEATHER_TTL_MS = 30 * 60 * 1000; // 30 minutos
const weatherCache = new Map<string, { expires: number; data: WeatherForecast }>();

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator((data: { lat: number; lng: number }) => {
    const validLat = Number.isFinite(data.lat) && Math.abs(data.lat) <= 90;
    const validLng = Number.isFinite(data.lng) && Math.abs(data.lng) <= 180;
    if (!validLat || !validLng) throw new Error("Coordenadas inválidas");
    return data;
  })
  .handler(async ({ data }): Promise<WeatherForecast> => {
    const key = `${data.lat.toFixed(2)},${data.lng.toFixed(2)}`;
    const cached = weatherCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.data;

    const params = new URLSearchParams({
      latitude: String(data.lat),
      longitude: String(data.lng),
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: "16",
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Open-Meteo respondió con estado ${res.status}`);
    }

    const json = (await res.json()) as OpenMeteoResponse;
    const daily = json.daily;

    const days: WeatherDay[] = (daily?.time ?? []).map((date, i) => ({
      date,
      code: daily?.weather_code[i] ?? 0,
      max: daily?.temperature_2m_max[i] ?? 0,
      min: daily?.temperature_2m_min[i] ?? 0,
      rainChance: daily?.precipitation_probability_max?.[i] ?? null,
      wind: daily?.wind_speed_10m_max?.[i] ?? null,
    }));

    const forecast: WeatherForecast = { timezone: json.timezone, days };
    weatherCache.set(key, { expires: Date.now() + WEATHER_TTL_MS, data: forecast });
    return forecast;
  });
