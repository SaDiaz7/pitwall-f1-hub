import { createServerFn } from "@tanstack/react-start";

export type NewsLang = "en" | "es";

export interface F1NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string | null;
  publishedAt: string; // ISO
  source: string;
}

interface FeedConfig {
  source: string;
  url: string;
}

// Solo fuentes con el formato verificado (RSS 2.0 con título, link, descripción, fecha e imagen en <enclosure>).
// Para sumar una fuente, agregá otra entrada con la misma forma.
export const NEWS_FEEDS: Record<NewsLang, FeedConfig[]> = {
  es: [{ source: "Motorsport.com LATAM", url: "https://lat.motorsport.com/rss/f1/news/" }],
  en: [{ source: "Motorsport.com", url: "https://www.motorsport.com/rss/f1/news/" }],
};

export const NEWS_LANGS: NewsLang[] = (Object.keys(NEWS_FEEDS) as NewsLang[]).filter(
  (lang) => NEWS_FEEDS[lang].length > 0,
);
export const DEFAULT_NEWS_LANG: NewsLang = NEWS_FEEDS.es.length > 0 ? "es" : "en";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MAX_ITEMS = 40;
const SUMMARY_MAX = 220;

// ---------- Lectura del RSS (sin librerías: el formato es simple y ya lo verificamos) ----------

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function fromCode(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => fromCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => fromCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => ENTITIES[name.toLowerCase()] ?? match);
}

// Contenido de una etiqueta. Si viene en CDATA se devuelve tal cual; si no, se decodifican las entidades.
function tagContent(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  if (!match) return null;
  const raw = match[1] ?? "";
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw);
  return cdata ? (cdata[1] ?? "") : decodeEntities(raw);
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<a\s[^>]*class=['"]more['"][^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function makeSummary(html: string): string {
  const text = htmlToText(html);
  const cutBySource = /\.{3}$/.test(text);
  const base = text.replace(/\s*\.{3}$/, "").trim();

  let short = base;
  if (base.length > SUMMARY_MAX) {
    const cut = base.slice(0, SUMMARY_MAX);
    const lastSpace = cut.lastIndexOf(" ");
    short = (lastSpace > SUMMARY_MAX * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:–-]+$/, "");
  }
  return cutBySource || base.length > SUMMARY_MAX ? `${short}…` : short;
}

// Saca los parámetros de seguimiento (utm_*) y descarta links que no sean http(s).
function cleanUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseFeed(xml: string, source: string): F1NewsItem[] {
  const items: F1NewsItem[] = [];

  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1] ?? "";

    const title = htmlToText(tagContent(block, "title") ?? "");
    const url = cleanUrl(tagContent(block, "link") ?? "");
    const published = Date.parse(tagContent(block, "pubDate") ?? "");
    if (!title || !url || Number.isNaN(published)) continue;

    const enclosure = /<enclosure\s[^>]*url=["']([^"']+)["']/i.exec(block);
    const image = enclosure?.[1] ? cleanUrl(decodeEntities(enclosure[1])) : null;
    const guid = (tagContent(block, "guid") ?? "").trim() || url;

    items.push({
      id: `${source}:${guid}`,
      title,
      summary: makeSummary(tagContent(block, "description") ?? ""),
      url,
      image,
      publishedAt: new Date(published).toISOString(),
      source,
    });
  }

  return items;
}

async function fetchFeed(feed: FeedConfig): Promise<F1NewsItem[]> {
  const response = await fetch(feed.url, {
    headers: {
      Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
      "User-Agent": "PitWall/1.0 (+https://pitwallff1.netlify.app)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Feed ${feed.source}: HTTP ${response.status}`);
  return parseFeed(await response.text(), feed.source);
}

// ---------- Server function ----------

const newsCache = new Map<NewsLang, { expires: number; data: F1NewsItem[] }>();

async function loadNews(lang: NewsLang): Promise<F1NewsItem[]> {
  const feeds = NEWS_FEEDS[lang];
  if (feeds.length === 0) return [];

  const cached = newsCache.get(lang);
  if (cached && cached.expires > Date.now()) return cached.data;

  const results = await Promise.allSettled(feeds.map(fetchFeed));
  for (const result of results) {
    if (result.status === "rejected") console.error("Noticias:", result.reason);
  }
  const all = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  if (all.length === 0) {
    // Si el medio falla, mostramos la última copia buena.
    if (cached) return cached.data;
    throw new Error("No pudimos cargar las noticias.");
  }

  // Más nuevas primero y sin repetidas.
  const seen = new Set<string>();
  const data = all
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    })
    .slice(0, MAX_ITEMS);

  newsCache.set(lang, { expires: Date.now() + CACHE_TTL_MS, data });
  return data;
}

export const getF1News = createServerFn({ method: "GET" })
  .inputValidator((data: { lang: NewsLang }) => {
    if (data.lang !== "en" && data.lang !== "es") throw new Error("Idioma inválido");
    return data;
  })
  .handler(async ({ data }): Promise<F1NewsItem[]> => loadNews(data.lang));