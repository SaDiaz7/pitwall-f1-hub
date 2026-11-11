import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Thumb, timeAgo } from "@/components/HomeNews";
import { useNow } from "@/hooks/useNow";
import { getF1News, type F1NewsItem } from "@/lib/f1-news";

const MATCH = /colapinto/i;
const COUNT = 4;

// Las últimas notas (en español e inglés) que mencionan a Franco.
export function ColapintoNews() {
  const now = useNow(60_000);
  const [items, setItems] = useState<F1NewsItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([getF1News({ data: { lang: "es" } }), getF1News({ data: { lang: "en" } })]).then(
      (results) => {
        if (cancelled) return;
        const all = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
        const about = all
          .filter((item) => MATCH.test(`${item.title} ${item.summary}`))
          .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
          .slice(0, COUNT);
        setItems(about);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Noticias de Franco</h2>
        <Link to="/noticias" className="text-sm font-semibold text-primary hover:underline">
          Todas las noticias
        </Link>
      </div>

      {items === null ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-3">
          {Array.from({ length: COUNT }, (_, i) => (
            <li key={i} className="skeleton h-28" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
          Todavía no hay notas sobre Franco entre las últimas noticias. Mirá todas las de la F1 en{" "}
          <Link to="/noticias" className="font-semibold text-primary hover:underline">
            Noticias
          </Link>
          .
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-3">
          {items.map((item, index) => (
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
      )}
    </section>
  );
}