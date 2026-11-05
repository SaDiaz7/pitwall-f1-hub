import fs from "node:fs";

const W = 200;
const H = 120;
const PAD = 10;
const MAX_POINTS = 200;

const geo = JSON.parse(fs.readFileSync("public/data/f1-circuits.geojson", "utf8"));

function pointsOf(geometry) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  let lines = [];
  if (geometry.type === "LineString") lines = [geometry.coordinates];
  if (geometry.type === "MultiLineString") lines = geometry.coordinates;
  const out = [];
  for (const line of lines) {
    for (const p of line) {
      if (typeof p[0] === "number" && typeof p[1] === "number") out.push([p[0], p[1]]);
    }
  }
  return out;
}

function buildPath(points) {
  const meanLat = points.reduce((sum, p) => sum + p[1], 0) / points.length;
  const kx = Math.cos((meanLat * Math.PI) / 180);
  const projected = points.map((p) => [p[0] * kx, -p[1]]);
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((W - 2 * PAD) / spanX, (H - 2 * PAD) / spanY);
  const offsetX = (W - spanX * scale) / 2;
  const offsetY = (H - spanY * scale) / 2;

  const step = Math.max(1, Math.ceil(projected.length / MAX_POINTS));
  const parts = [];
  projected.forEach((p, i) => {
    if (i % step !== 0 && i !== projected.length - 1) return;
    const px = ((p[0] - minX) * scale + offsetX).toFixed(1);
    const py = ((p[1] - minY) * scale + offsetY).toFixed(1);
    parts.push(`${parts.length === 0 ? "M" : "L"}${px} ${py}`);
  });
  return parts.join(" ");
}

const lines = [];
for (const feature of geo.features ?? []) {
  const id = String(feature.properties?.id ?? "");
  const points = pointsOf(feature.geometry);
  if (!id || points.length < 2) {
    console.warn("Se salteó un circuito sin id o sin puntos:", id);
    continue;
  }
  lines.push(`update public.game_circuits set path = '${buildPath(points)}' where id = '${id}';`);
}

fs.writeFileSync("trazados-juego.sql", lines.join("\n") + "\n", "utf8");
console.log(`Listo: ${lines.length} circuitos escritos en trazados-juego.sql`);