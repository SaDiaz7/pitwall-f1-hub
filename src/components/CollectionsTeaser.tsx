import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { useCollections } from "@/hooks/useCollections";
import type { Collection } from "@/lib/collections";
import { cn } from "@/lib/utils";

const progress = (collection: Collection) =>
  collection.card_ids.length > 0 ? collection.owned / collection.card_ids.length : 0;

export function CollectionsTeaser() {
  const { collections, loading } = useCollections();

  if (loading) return null;

  // Las ya reclamadas no se muestran: queda lo que todavía se puede completar o reclamar.
  const open = collections.filter((collection) => !collection.claimed && collection.card_ids.length > 0);
  if (open.length === 0) return null;

  const top = [...open].sort((a, b) => progress(b) - progress(a)).slice(0, 3);

  return (
    <section className="fade-up">
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Colecciones</h2>
        <Link to="/colecciones" className="text-sm font-semibold text-primary hover:underline">
          Ver todas
        </Link>
      </div>

      <ul className="space-y-2">
        {top.map((collection, index) => {
          const total = collection.card_ids.length;
          const missing = total - collection.owned;
          const ready = missing <= 0;

          return (
            <li key={collection.id} className="fade-up" style={{ "--i": index } as CSSProperties}>
              <Link
                to="/colecciones"
                className={cn(
                  "card-link block space-y-2 rounded-2xl border bg-card p-3 hover:bg-accent/40",
                  ready && "border-primary/60",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-semibold">{collection.name}</p>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {collection.owned}/{total}
                  </span>
                </div>
                <AnimatedBar percent={Math.round(progress(collection) * 100)} className="h-1.5" />
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    ready ? "font-semibold text-primary" : "text-muted-foreground",
                  )}
                >
                  {ready ? (
                    <>
                      <Gift className="h-3.5 w-3.5" /> ¡Completa! Reclamá tu sobre
                    </>
                  ) : (
                    `Te ${missing === 1 ? "falta 1 carta" : `faltan ${missing} cartas`}`
                  )}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}