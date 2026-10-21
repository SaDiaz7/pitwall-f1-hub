// Lectura de los trazados de circuitos (GeoJSON) y conversión a un camino SVG.

export interface Track {
  name: string;
  points: [number, number][]; // [longitud, latitud]
  center: [number, number];
}

interface GeoFeature {
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown } | null;
}

const TRACKS_URL = "/data/f1-circuits.geojson";
const MAX_DISTANCE_KM = 15;

export const MAP_WIDTH = 200;
export const MAP_HEIGHT = 120;
const MAP_PADDING = 10;

function readPoint(value: unknown): [number, number] | null {
  if (!Array.isArray(value)) return null;
  const lng = value[0];
  const lat = value[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return [lng, lat];
}

function toPoints(geometry: GeoFeature["geometry"]): [number, number][] {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];

  let lines: unknown[] = [];
  if (geometry.type === "LineString") lines = [geometry.coordinates];
  if (geometry.type === "MultiLineString") lines = geometry.coordinates as unknown[];

  const points: [number, number][] = [];
  for (const line of lines) {
    if (!Array.isArray(line)) continue;
    for (const raw of line) {
      const point = readPoint(raw);
      if (point) points.push(point);
    }
  }
  return points;
}

function toTrack(feature: GeoFeature): Track | null {
  const points = toPoints(feature.geometry);
  if (points.length < 2) return null;

  const sum = points.reduce<[number, number]>((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0]);
    const name = String(feature.properties?.["Name"] ?? feature.properties?.["name"] ?? "");

  return { name, points, center: [sum[0] / points.length, sum[1] / points.length] };
}

// Se descarga una sola vez y queda en memoria.
let tracksPromise: Promise<Track[]> | null = null;

export function loadTracks(): Promise<Track[]> {
  if (!tracksPromise) {
    tracksPromise = fetch(TRACKS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo leer ${TRACKS_URL} (${res.status})`);
        return res.json() as Promise<{ features?: GeoFeature[] }>;
      })
      .then((json) => (json.features ?? []).map(toTrack).filter((t): t is Track => t !== null))
      .catch((error) => {
        tracksPromise = null; // permite reintentar más tarde
        throw error;
      });
  }
  return tracksPromise;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// Busca el trazado más cercano a las coordenadas del circuito.
export function findTrack(tracks: Track[], lat: number, lng: number): Track | null {
  let best: Track | null = null;
  let bestDistance = Infinity;

  for (const track of tracks) {
    const d = distanceKm(lat, lng, track.center[1], track.center[0]);
    if (d < bestDistance) {
      best = track;
      bestDistance = d;
    }
  }

  return best && bestDistance <= MAX_DISTANCE_KM ? best : null;
}

// Convierte las coordenadas geográficas en un camino SVG que entra en el recuadro.
export function buildTrackPath(points: [number, number][]): string {
  const meanLat = points.reduce((sum, [, lat]) => sum + lat, 0) / points.length;
  const kx = Math.cos((meanLat * Math.PI) / 180); // corrige el achatamiento de la longitud

  const projected = points.map(([lng, lat]) => [lng * kx, -lat] as const);
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((MAP_WIDTH - 2 * MAP_PADDING) / spanX, (MAP_HEIGHT - 2 * MAP_PADDING) / spanY);

  const offsetX = (MAP_WIDTH - spanX * scale) / 2;
  const offsetY = (MAP_HEIGHT - spanY * scale) / 2;

  return projected
    .map(([x, y], i) => {
      const px = ((x - minX) * scale + offsetX).toFixed(1);
      const py = ((y - minY) * scale + offsetY).toFixed(1);
      return `${i === 0 ? "M" : "L"}${px} ${py}`;
    })
    .join(" ");
}
