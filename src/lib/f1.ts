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
    url?: string;
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
  MRData: {
    StandingsTable: { StandingsLists: { ConstructorStandings?: ConstructorStandingRaw[] }[] };
  };
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
  "Qatar Grand Prix": "GP de Catar",
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

const translateRaceName = (name: string) => {
  const translated = RACE_NAMES_ES[name];
  if (!translated) console.warn(`[f1] Falta traducir el GP: "${name}"`);
  return translated ?? name;
};
const translateCountry = (country: string) => COUNTRIES_ES[country] ?? country;

// ---------- Descarga con caché en memoria ----------

const cache = new Map<string, { expires: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

async function fetchJolpica<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  // Si ya hay un pedido igual en curso, esperamos ese en vez de hacer otro.
  const pending = inFlight.get(path);
  if (pending) return pending as Promise<T>;

  const request = (async () => {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000), // si tarda más de 8 segundos, se corta
      });
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
    } finally {
      inFlight.delete(path);
    }
  })();

  inFlight.set(path, request);
  return request;
}

// ---------- Funciones de servidor ----------

async function loadDriverStandings(season: number | null): Promise<Driver[]> {
  const base = season === null ? "/current" : `/${season}`;
  const json = await fetchJolpica<DriverStandingsResponse>(`${base}/driverstandings/?limit=100`);
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
      wikiUrl: entry.Driver.url,
    };
  });
}

async function loadConstructorStandings(season: number | null): Promise<Team[]> {
  const base = season === null ? "/current" : `/${season}`;
  const json = await fetchJolpica<ConstructorStandingsResponse>(`${base}/constructorstandings/?limit=100`);
  const list = json.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];

  return list.map((entry) => ({
    id: entry.Constructor.constructorId,
    name: entry.Constructor.name,
    points: Number(entry.points),
    wins: Number(entry.wins),
  }));
}

// Temporada en curso (la usan Favoritos y otras pantallas).
export const getDriverStandings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Driver[]> => loadDriverStandings(null),
);

export const getConstructorStandings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Team[]> => loadConstructorStandings(null),
);

// Cualquier temporada, por año.
function validateSeason(data: { season: number }) {
  if (!Number.isInteger(data.season) || data.season < 1950 || data.season > 2100) {
    throw new Error("Temporada inválida");
  }
  return data;
}

export const getDriverStandingsForSeason = createServerFn({ method: "GET" })
  .inputValidator(validateSeason)
  .handler(async ({ data }): Promise<Driver[]> => loadDriverStandings(data.season));

export const getConstructorStandingsForSeason = createServerFn({ method: "GET" })
  .inputValidator(validateSeason)
  .handler(async ({ data }): Promise<Team[]> => loadConstructorStandings(data.season));

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

export const getSchedule = createServerFn({ method: "GET" }).handler(
  async (): Promise<GrandPrix[]> => {
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
          sessions.push({
            name: SESSION_LABELS[key],
            start: new Date(`${raw.date}T${raw.time}`).toISOString(),
          });
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
  },
);

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
  MRData: {
    DriverTable: { Drivers?: { driverId: string; givenName: string; familyName: string }[] };
  };
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
  fastestLapTime: string | null;
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
          FastestLap?: { rank: string; Time?: { time: string } };
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
    const json = await fetchJolpica<RaceResultsResponse>(
      `/current/${data.round}/results/?limit=100`,
    );
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
      fastestLapTime: r.FastestLap?.Time?.time ?? null,
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
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: "16",
    });

    let json: OpenMeteoResponse;
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new Error(`Open-Meteo respondió con estado ${res.status}`);
      }
      json = (await res.json()) as OpenMeteoResponse;
    } catch (error) {
      // Si falla pero hay un pronóstico viejo guardado, lo mostramos.
      if (cached) return cached.data;
      throw error;
    }

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

  
// ---------- Ficha de un piloto ----------

// ---------- Ficha de un piloto ----------

export interface DriverProfile {
  id: string;
  name: string;
  code: string | null;
  number: number | null;
  nationality: string;
  dateOfBirth: string;
  wikiUrl: string | null;
}

// Resumen de una temporada, armado a partir de los resultados de cada carrera.
export interface CareerSeason {
  season: number;
  teams: string[];
  races: number;
  wins: number;
  podiums: number;
}

export interface CareerTotals {
  starts: number | null;
  wins: number | null;
  podiums: number | null;
  poles: number | null;
}

export interface DriverDetail {
  profile: DriverProfile;
  seasons: CareerSeason[];
  totals: CareerTotals;
}

// Posición final oficial de un piloto en una temporada.
export interface SeasonStanding {
  season: number;
  position: number | null;
  points: number | null;
  wins: number | null;
  failed: boolean; // true si la consulta falló (distinto de "no hay datos")
}

interface DriverInfoResponse {
  MRData: {
    DriverTable: {
      Drivers?: {
        driverId: string;
        permanentNumber?: string;
        code?: string;
        url?: string;
        givenName: string;
        familyName: string;
        dateOfBirth: string;
        nationality: string;
      }[];
    };
  };
}

interface DriverResultsResponse {
  MRData: {
    total: string;
    RaceTable: {
      Races?: {
        season: string;
        round: string;
        Results?: { position: string; Constructor: { name: string } }[];
      }[];
    };
  };
}

interface SeasonStandingResponse {
  MRData: {
    StandingsTable: {
      StandingsLists?: {
        DriverStandings?: { position?: string; points: string; wins: string }[];
      }[];
    };
  };
}

interface TotalResponse {
  MRData: { total: string };
}

// Devuelve solo el total de resultados de una consulta (null si falla).
async function fetchTotal(path: string): Promise<number | null> {
  try {
    const json = await fetchJolpica<TotalResponse>(path);
    const total = Number(json.MRData.total);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

const RESULTS_PAGE_SIZE = 100;
const MAX_RESULTS_PAGES = 5;

// Recorre todos los resultados del piloto y los agrupa por temporada.
async function fetchCareerSeasons(id: string): Promise<CareerSeason[]> {
  const byYear = new Map<number, CareerSeason>();
  let total: number | null = null;

  for (let page = 0; page < MAX_RESULTS_PAGES; page++) {
    const offset = page * RESULTS_PAGE_SIZE;

    let json: DriverResultsResponse;
    try {
      json = await fetchJolpica<DriverResultsResponse>(
        `/drivers/${id}/results/?limit=${RESULTS_PAGE_SIZE}&offset=${offset}`,
      );
    } catch (error) {
      console.error(`Resultados de ${id} (página ${page + 1}):`, error);
      break;
    }

    if (total === null) {
      const parsed = Number(json.MRData.total);
      total = Number.isFinite(parsed) ? parsed : null;
    }

    for (const race of json.MRData.RaceTable.Races ?? []) {
      const result = race.Results?.[0];
      if (!result) continue;

      const year = Number(race.season);
      const entry = byYear.get(year) ?? { season: year, teams: [], races: 0, wins: 0, podiums: 0 };

      const team = result.Constructor.name;
      if (!entry.teams.includes(team)) entry.teams.push(team);

      entry.races += 1;
      const position = Number(result.position);
      if (position === 1) entry.wins += 1;
      if (position >= 1 && position <= 3) entry.podiums += 1;

      byYear.set(year, entry);
    }

    if (total !== null && offset + RESULTS_PAGE_SIZE >= total) break;
  }

  return [...byYear.values()].sort((a, b) => a.season - b.season);
}

export const getDriverDetail = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => {
    if (!/^[a-z0-9_-]{1,50}$/i.test(data.id)) throw new Error("Piloto inválido");
    return data;
  })
  .handler(async ({ data }): Promise<DriverDetail | null> => {
    const id = data.id;

    const infoJson = await fetchJolpica<DriverInfoResponse>(`/drivers/${id}/`);
    const info = infoJson.MRData.DriverTable.Drivers?.[0];
    if (!info) return null;

    const seasons = await fetchCareerSeasons(id);
    const poles = await fetchTotal(`/drivers/${id}/grid/1/results/?limit=1`);

    const hasSeasons = seasons.length > 0;
    const number = Number(info.permanentNumber);

    return {
      profile: {
        id: info.driverId,
        name: `${info.givenName} ${info.familyName}`,
        code: info.code ?? null,
        number: Number.isFinite(number) && info.permanentNumber ? number : null,
        nationality: info.nationality,
        dateOfBirth: info.dateOfBirth,
        wikiUrl: info.url ?? null,
      },
      seasons,
      totals: {
        starts: hasSeasons ? seasons.reduce((sum, s) => sum + s.races, 0) : null,
        wins: hasSeasons ? seasons.reduce((sum, s) => sum + s.wins, 0) : null,
        podiums: hasSeasons ? seasons.reduce((sum, s) => sum + s.podiums, 0) : null,
        poles,
      },
    };
  });

// Posición final y puntos oficiales de un piloto en algunas temporadas.
// La página los pide de a pocos, después de mostrarse.
export const getDriverSeasonStandings = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; seasons: number[] }) => {
    if (!/^[a-z0-9_-]{1,50}$/i.test(data.id)) throw new Error("Piloto inválido");
    if (!Array.isArray(data.seasons) || data.seasons.length === 0 || data.seasons.length > 8) {
      throw new Error("Temporadas inválidas");
    }
    if (!data.seasons.every((s) => Number.isInteger(s) && s >= 1950 && s <= 2100)) {
      throw new Error("Temporadas inválidas");
    }
    return data;
  })
  .handler(async ({ data }): Promise<SeasonStanding[]> => {
    return Promise.all(
      data.seasons.map(async (season): Promise<SeasonStanding> => {
        try {
          const json = await fetchJolpica<SeasonStandingResponse>(
            `/${season}/drivers/${data.id}/driverstandings/`,
          );
          const entry = json.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings?.[0];
          if (!entry) return { season, position: null, points: null, wins: null, failed: false };

          const position = Number(entry.position);
          return {
            season,
            position: entry.position !== undefined && Number.isFinite(position) ? position : null,
            points: Number(entry.points),
            wins: Number(entry.wins),
            failed: false,
          };
        } catch (error) {
          console.error(`Posiciones de ${data.id} en ${season}:`, error);
          return { season, position: null, points: null, wins: null, failed: true };
        }
      }),
    );
  });
  // ---------- Fotos de pilotos (Wikipedia) ----------

export interface DriverPhoto {
  url: string; // miniatura de la imagen principal
  page: string; // página de Wikipedia de donde sale (para dar el crédito)
}

export type DriverPhotos = Record<string, DriverPhoto | null>;

interface WikiSummary {
  type?: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page?: string } };
}

const WIKI_USER_AGENT =
  "PitWall/1.0 (https://pitwallff1.netlify.app; proyecto personal sin fines de lucro; contacto: santi.cat.rn@gmail.com)";
const PHOTO_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const PHOTO_MISS_TTL_MS = 60 * 60 * 1000; // 1 hora si no hay foto
const PHOTO_CONCURRENCY = 5;

const photoCache = new Map<string, { expires: number; photo: DriverPhoto | null }>();

// Solo se aceptan enlaces de la Wikipedia en inglés; de ahí sale el título de la página.
function wikiTitle(wikiUrl: string): string | null {
  const match = wikiUrl.match(/^https?:\/\/en\.wikipedia\.org\/wiki\/([^?#\s/]{1,200})$/);
  return match?.[1] ?? null;
}

async function fetchWikiPhoto(title: string): Promise<DriverPhoto | null> {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
    headers: { "User-Agent": WIKI_USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as WikiSummary;
  if (json.type === "disambiguation" || !json.thumbnail?.source) return null;

  return {
    url: json.thumbnail.source,
    page: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`,
  };
}

export const getDriverPhotos = createServerFn({ method: "POST" })
  .inputValidator((data: { drivers: { id: string; wikiUrl: string | null }[] }) => {
    if (!Array.isArray(data.drivers) || data.drivers.length > 40) throw new Error("Pedido inválido");
    for (const d of data.drivers) {
      if (typeof d.id !== "string" || !/^[a-z0-9_-]{1,50}$/i.test(d.id)) throw new Error("Piloto inválido");
      if (d.wikiUrl !== null && (typeof d.wikiUrl !== "string" || d.wikiUrl.length > 300)) {
        throw new Error("Enlace inválido");
      }
    }
    return data;
  })
  .handler(async ({ data }): Promise<DriverPhotos> => {
    const result: DriverPhotos = {};
    const pending: { id: string; title: string }[] = [];
    const now = Date.now();

    for (const driver of data.drivers) {
      const cached = photoCache.get(driver.id);
      if (cached && cached.expires > now) {
        result[driver.id] = cached.photo;
        continue;
      }

      const title = driver.wikiUrl ? wikiTitle(driver.wikiUrl) : null;
      if (!title) {
        result[driver.id] = null;
        continue;
      }
      pending.push({ id: driver.id, title });
    }

    // De a pocas consultas a la vez, para ser amables con Wikipedia.
    for (let i = 0; i < pending.length; i += PHOTO_CONCURRENCY) {
      const batch = pending.slice(i, i + PHOTO_CONCURRENCY);

      await Promise.all(
        batch.map(async ({ id, title }) => {
          try {
            const photo = await fetchWikiPhoto(title);
            photoCache.set(id, { expires: Date.now() + (photo ? PHOTO_TTL_MS : PHOTO_MISS_TTL_MS), photo });
            result[id] = photo;
          } catch (error) {
            console.error(`Foto de ${id}:`, error);
            result[id] = null;
          }
        }),
      );
    }

    return result;
  });