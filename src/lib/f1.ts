import { createServerFn } from "@tanstack/react-start";
import type { Driver, GrandPrix, Team } from "@/lib/types";

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

interface RaceRaw {
  season: string;
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string };
  };
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
  "São Paulo Grand Prix": "GP de São Paulo",
  "Las Vegas Grand Prix": "GP de Las Vegas",
  "Qatar Grand Prix": "GP de Catar",
  "Abu Dhabi Grand Prix": "GP de Abu Dabi",
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

export const getSchedule = createServerFn({ method: "GET" }).handler(async (): Promise<GrandPrix[]> => {
  const json = await fetchJolpica<ScheduleResponse>("/current/?limit=100");
  const races = json.MRData.RaceTable.Races ?? [];
  const now = Date.now();

  return races.map((race) => {
    const start = new Date(`${race.date}T${race.time ?? "00:00:00Z"}`).getTime();
    const finished = start + RACE_DURATION_MS < now;

    return {
      id: `${race.season}-${race.round}`,
      round: Number(race.round),
      name: translateRaceName(race.raceName),
      circuit: race.Circuit.circuitName,
      country: translateCountry(race.Circuit.Location.country),
      date: race.date,
      status: finished ? "finalizado" : "proximo",
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