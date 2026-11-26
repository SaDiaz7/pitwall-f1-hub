// Baja estadísticas de carrera de Jolpica-F1 y arma scripts/hl-items.sql para el juego "¿Más o menos?".
// Uso: node scripts/build-hl-data.mjs [--through 2025]
//   --through = último año con campeonato terminado (para contar títulos). Por defecto, el año anterior.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const BASE = "https://api.jolpi.ca/ergast/f1";
const CACHE_FILE = "scripts/.hl-cache.json";
const OUT_FILE = "scripts/hl-items.sql";
const MIN_PODIUMS = 10; // con menos podios solo entran los pilotos de la grilla actual
const PAGE = 100;
const DELAY_MS = 350;
const FIRST_SEASON = 1950;
const SIX_HOURS = 6 * 60 * 60 * 1000;

const currentYear = new Date().getFullYear();
const throughArg = process.argv.indexOf("--through");
const through = throughArg >= 0 ? Number(process.argv[throughArg + 1]) : currentYear - 1;
if (!Number.isInteger(through) || through < FIRST_SEASON) {
  console.error("Uso: node scripts/build-hl-data.mjs [--through 2025]");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};

async function getJson(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    await sleep(DELAY_MS);
    const response = await fetch(url);
    if (response.status === 429) {
      console.log("\n  La API pidió esperar. Pausa de 60 segundos…");
      await sleep(60_000);
      continue;
    }
    if (!response.ok) throw new Error(`Error ${response.status} en ${url}`);
    return response.json();
  }
  throw new Error(`Demasiados reintentos en ${url}`);
}

async function cached(url, reduce, ttl) {
  const hit = cache[url];
  if (hit && Date.now() - hit.at < ttl) return hit.value;

  const json = await getJson(url);
  let value;
  try {
    value = reduce(json);
  } catch (error) {
    console.error(`\nFormato inesperado en ${url}. Esto devolvió (copiá y pegame este texto):`);
    console.error(JSON.stringify(json).slice(0, 800));
    throw error;
  }

  cache[url] = { at: Date.now(), value };
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  return value;
}

const toDriver = (driver) => ({
  id: driver.driverId,
  name: `${driver.givenName} ${driver.familyName}`,
  nat: driver.nationality ?? "",
});

const reduceResults = (json) => ({
  total: Number(json.MRData.total),
  drivers: json.MRData.RaceTable.Races.flatMap((race) => race.Results.map((result) => toDriver(result.Driver))),
});

const reduceChampion = (json) => {
  const entry = json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings?.[0];
  return entry ? toDriver(entry.Driver) : null;
};

const reduceStandings = (json) =>
  (json.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []).map((entry) => toDriver(entry.Driver));

async function collect(path, label) {
  const rows = [];
  let total = Infinity;
  for (let offset = 0; offset < total; offset += PAGE) {
    const page = await cached(`${BASE}/${path}.json?limit=${PAGE}&offset=${offset}`, reduceResults, SIX_HOURS);
    total = page.total;
    rows.push(...page.drivers);
    process.stdout.write(`\r${label}: ${rows.length}/${total}   `);
  }
  console.log();
  if (rows.length !== total) console.warn(`  Ojo: se esperaban ${total} filas y llegaron ${rows.length}.`);
  return rows;
}

console.log("Bajando datos de Jolpica-F1 (tarda uno o dos minutos)…");

const wins = await collect("results/1", "Victorias");
const seconds = await collect("results/2", "Segundos puestos");
const thirds = await collect("results/3", "Terceros puestos");
const poles = await collect("grid/1/results", "Poles");

const champions = [];
for (let year = FIRST_SEASON; year <= through; year++) {
  const champion = await cached(`${BASE}/${year}/driverStandings/1.json`, reduceChampion, Infinity);
  process.stdout.write(`\rTítulos: temporada ${year}   `);
  if (champion) champions.push(champion);
  else console.warn(`\n  Sin campeón para ${year}`);
}
console.log();

const grid = await cached(`${BASE}/${currentYear}/driverStandings.json?limit=100`, reduceStandings, 0);

// Año de debut (primera temporada en que aparece) y de nacimiento, desde la lista de pilotos de cada temporada.
const reduceSeasonDrivers = (json) => ({
  total: Number(json.MRData.total),
  drivers: json.MRData.DriverTable.Drivers.map((driver) => ({
    id: driver.driverId,
    birthYear: driver.dateOfBirth ? Number(driver.dateOfBirth.slice(0, 4)) : null,
  })),
});

const debuts = new Map();
for (let year = FIRST_SEASON; year <= currentYear; year++) {
  const ttl = year === currentYear ? 0 : Infinity;
  let total = Infinity;
  for (let offset = 0; offset < total; offset += PAGE) {
    const page = await cached(`${BASE}/${year}/drivers.json?limit=${PAGE}&offset=${offset}`, reduceSeasonDrivers, ttl);
    total = page.total;
    for (const driver of page.drivers) {
      if (!debuts.has(driver.id)) debuts.set(driver.id, { debut: year, birthYear: driver.birthYear });
    }
  }
  process.stdout.write(`\rDebuts: temporada ${year}   `);
}
console.log();

const drivers = new Map();
const touch = (driver) => {
  if (!drivers.has(driver.id)) {
    drivers.set(driver.id, { ...driver, wins: 0, podiums: 0, poles: 0, titles: 0, current: false });
  }
  return drivers.get(driver.id);
};

for (const driver of wins) {
  const item = touch(driver);
  item.wins++;
  item.podiums++;
}
for (const driver of seconds) touch(driver).podiums++;
for (const driver of thirds) touch(driver).podiums++;
for (const driver of poles) touch(driver).poles++;
for (const driver of champions) touch(driver).titles++;
for (const driver of grid) touch(driver).current = true;

const pool = [...drivers.values()]
  .filter((driver) => driver.podiums >= MIN_PODIUMS || driver.current)
  .sort((a, b) => b.wins - a.wins || b.podiums - a.podiums || a.name.localeCompare(b.name));

const esc = (text) => text.replace(/'/g, "''");
const num = (value) => (value === null || value === undefined ? "null" : String(value));
const values = pool
  .map((d) => {
    const extra = debuts.get(d.id) ?? { debut: null, birthYear: null };
    return `  ('${esc(d.id)}', '${esc(d.name)}', '${esc(d.nat)}', ${d.wins}, ${d.podiums}, ${d.poles}, ${d.titles}, ${d.current}, ${num(extra.birthYear)}, ${num(extra.debut)})`;
  })
  .join(",\n");

const sql = `-- Generado el ${new Date().toISOString()} (títulos hasta ${through})
insert into public.hl_items (id, name, nationality, wins, podiums, poles, titles, is_current, birth_year, debut)
values
${values}
on conflict (id) do update set
  name = excluded.name,
  nationality = excluded.nationality,
  wins = excluded.wins,
  podiums = excluded.podiums,
  poles = excluded.poles,
  titles = excluded.titles,
  is_current = excluded.is_current,
  birth_year = excluded.birth_year,
  debut = excluded.debut,
  updated_at = now();
`;

writeFileSync(OUT_FILE, sql);

console.log(`\nListo: ${pool.length} pilotos (${pool.filter((d) => d.current).length} de la grilla actual).`);
console.table(pool.slice(0, 10).map(({ name, wins, podiums, poles, titles }) => ({ name, wins, podiums, poles, titles })));
console.log(`Se guardó ${OUT_FILE}. Abrilo, copiá todo y pegalo en el SQL Editor de Supabase.`);