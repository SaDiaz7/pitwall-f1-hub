import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { useNow } from "@/hooks/useNow";
import { DEFAULT_NEWS_LANG, getF1News, type F1NewsItem } from "@/lib/f1-news";

const COUNT = 4;

// Fecha fija (UTC) para el primer dibujo, así no hay diferencias entre servidor y navegador.
const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", timeZone: "UTC" });

export function timeAgo(iso: string, now: number | null): string {
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

export function Thumb({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
        <Newspaper className="h-6 w-6 opacity-50" />
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
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  );
}

export function HomeNews() {
  const now = useNow(60_000);
  const [items, setItems] = useState<F1NewsItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getF1News({ data: { lang: DEFAULT_NEWS_LANG } })
      .then((news) => {
        if (!cancelled) setItems(news.slice(0, COUNT));
      })
      .catch((error) => {
        console.error("Noticias en Inicio:", error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Si no hay noticias o falló la carga, la sección no aparece.
  if (failed || (items !== null && items.length === 0)) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Últimas noticias</h2>
        <Link to="/noticias" className="text-sm font-semibold text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-3">
        {items === null
          ? Array.from({ length: COUNT }, (_, i) => <li key={i} className="skeleton h-28" />)
          : items.map((item, index) => (
              <li key={item.id} className="fade-up" style={{ "--i": index } as CSSProperties}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-link group flex h-full gap-3 overflow-hidden rounded-2xl border bg-card p-3"
                >
                  <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl sm:w-32">
                    <Thumb src={item.image} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-secondary px-1.5 py-0.5 font-semibold uppercase tracking-wide">
                        {item.source}
                      </span>
                      <span>{timeAgo(item.publishedAt, now)}</span>
                    </p>
                    <h3 className="mt-1.5 line-clamp-3 font-display text-lg font-bold leading-tight">{item.title}</h3>
                  </div>
                </a>
              </li>
            ))}
      </ul>
    </section>
  );
}