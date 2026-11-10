import { useRef, useState, type CSSProperties } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { ExternalLink, Newspaper } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useNow } from "@/hooks/useNow";
import {
  DEFAULT_NEWS_LANG,
  NEWS_LANGS,
  getF1News,
  type F1NewsItem,
  type NewsLang,
} from "@/lib/f1-news";
import { cn } from "@/lib/utils";

const route = getRouteApi("/_privado/noticias");

const PAGE_SIZE = 12;

const LANG_LABELS: Record<NewsLang, string> = { es: "Español", en: "English" };

// Fecha fija (UTC) para el primer dibujo, así no hay diferencias entre servidor y navegador.
const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

function timeAgo(iso: string, now: number | null): string {
  const published = Date.parse(iso);
  if (now === null) return dateFormatter.format(published);

  const minutes = Math.floor((now - published) / 60_000);
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  return dateFormatter.format(published);
}

type State = { status: "loading" } | { status: "error" } | { status: "done"; items: F1NewsItem[] };

function NewsImage({ src, className }: { src: string | null; className?: string | undefined }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-secondary text-muted-foreground", className)}>
        <Newspaper className="h-8 w-8 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100", className)}
    />
  );
}

function Meta({ item, now }: { item: F1NewsItem; now: number | null }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold uppercase tracking-wide">{item.source}</span>
      <span>{timeAgo(item.publishedAt, now)}</span>
    </p>
  );
}

function FeaturedNews({ item, now }: { item: F1NewsItem; now: number | null }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-link group fade-up grid overflow-hidden rounded-2xl border bg-card md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
    >
      <div className="aspect-video overflow-hidden md:aspect-auto md:min-h-64">
        <NewsImage src={item.image} className="h-full w-full" />
      </div>
      <div className="flex flex-col justify-center gap-3 p-5 md:p-7">
        <Meta item={item} now={now} />
        <h2 className="font-display text-2xl font-bold leading-tight md:text-4xl">{item.title}</h2>
        {item.summary && <p className="line-clamp-4 text-sm text-muted-foreground">{item.summary}</p>}
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Leer en {item.source} <ExternalLink className="h-4 w-4" />
        </span>
      </div>
    </a>
  );
}

function NewsCard({ item, index, now }: { item: F1NewsItem; index: number; now: number | null }) {
  return (
    <li className="fade-up" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="card-link group flex h-full flex-col overflow-hidden rounded-2xl border bg-card"
      >
        <div className="aspect-video overflow-hidden">
          <NewsImage src={item.image} className="h-full w-full" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <Meta item={item} now={now} />
          <h3 className="line-clamp-3 font-display text-xl font-bold leading-tight">{item.title}</h3>
          {item.summary && <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>}
        </div>
      </a>
    </li>
  );
}

function NewsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-64 w-full" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton h-72" />
        ))}
      </div>
    </div>
  );
}

export function NoticiasPage() {
  const { news } = route.useLoaderData();
  const now = useNow(60_000);

  const [lang, setLang] = useState<NewsLang>(DEFAULT_NEWS_LANG);
  const [state, setState] = useState<State>(news ? { status: "done", items: news } : { status: "error" });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const requestId = useRef(0);

  const load = (next: NewsLang) => {
    const id = ++requestId.current;
    setLang(next);
    setVisible(PAGE_SIZE);
    setState({ status: "loading" });

    getF1News({ data: { lang: next } })
      .then((items) => {
        if (id === requestId.current) setState({ status: "done", items });
      })
      .catch((error) => {
        console.error("Noticias:", error);
        if (id === requestId.current) setState({ status: "error" });
      });
  };

  const items = state.status === "done" ? state.items : [];
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <>
      <PageHeader
        title="Noticias"
        subtitle="Lo último de la F1, de medios internacionales. Tocá una nota para leerla en su sitio original."
      />

      {(NEWS_LANGS.length > 1 || lang === "en") && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {NEWS_LANGS.length > 1 && (
            <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
              {NEWS_LANGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => load(value)}
                  aria-pressed={lang === value}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                    lang === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {LANG_LABELS[value]}
                </button>
              ))}
            </div>
          )}
          {lang === "en" && (
            <p className="text-xs text-muted-foreground">Las notas están en el idioma original del medio: inglés.</p>
          )}
        </div>
      )}

      {state.status === "loading" && <NewsSkeleton />}

      {state.status === "error" && (
        <div className="space-y-3 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          <p>No pudimos cargar las noticias. Probá de nuevo en un rato.</p>
          <button
            type="button"
            onClick={() => load(lang)}
            className="rounded-lg border px-4 py-2 font-semibold text-foreground transition active:scale-95 hover:bg-accent/40 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === "done" && !featured && (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay noticias para mostrar.
        </div>
      )}

      {state.status === "done" && featured && (
        <div className="space-y-4">
          <FeaturedNews item={featured} now={now} />

          {rest.length > 0 && (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-4">
              {rest.slice(0, visible).map((item, index) => (
                <NewsCard key={item.id} item={item} index={index} now={now} />
              ))}
            </ul>
          )}

          {visible < rest.length && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
                className="rounded-lg border px-5 py-2 text-sm font-semibold transition active:scale-95 hover:bg-accent/40 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                Ver más noticias
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Las notas pertenecen a sus medios. PitWall muestra solo el título, un resumen corto y la imagen que cada
            medio publica en su feed; al tocar una tarjeta se abre la nota original.
          </p>
        </div>
      )}
    </>
  );
}