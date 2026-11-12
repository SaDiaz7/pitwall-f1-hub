import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatedBar } from "@/components/AnimatedBar";
import { StickerCard } from "@/components/StickerCard";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import { supabase } from "@/integrations/supabase/client";
import { statStr, type CardFace } from "@/lib/album";

interface TopCard extends CardFace {
  foil: boolean;
}

interface Summary {
  owned_count: number;
  total_count: number;
  foil_count: number;
  top_cards: TopCard[];
}

export function AlbumShowcase({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  // undefined = cargando, null = no disponible (perfil privado o error).
  const [summary, setSummary] = useState<Summary | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setSummary(undefined);

    supabase.rpc("get_profile_album", { p_user_id: userId }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        console.error("Cargar álbum del perfil:", error);
        setSummary(null);
        return;
      }
      const row = data?.[0];
      setSummary(row ? { ...row, top_cards: (row.top_cards ?? []) as unknown as TopCard[] } : null);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const cards = summary?.top_cards ?? [];
  const photos = useDriverPhotos(
    cards
      .filter((card) => card.kind === "driver")
      .map((card) => ({ id: card.card_id, wikiUrl: statStr(card.stats, "wiki_url") })),
  );

  if (summary === undefined) {
    return (
      <section className="rounded-2xl border bg-card p-5">
        <div className="skeleton h-40 w-full" />
      </section>
    );
  }
  if (summary === null) return null;
  if (!isSelf && summary.owned_count === 0) return null;

  const percent = summary.total_count > 0 ? Math.round((summary.owned_count / summary.total_count) * 100) : 0;

  return (
    <section className="fade-up rounded-2xl border bg-card p-5">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold uppercase">Álbum de cartas</h2>
        {isSelf && (
          <Link to="/album" className="text-sm font-semibold text-primary hover:underline">
            Ver mi álbum
          </Link>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="font-display text-2xl font-bold tabular-nums">
          {summary.owned_count}
          <span className="text-base text-muted-foreground"> / {summary.total_count}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {percent}% completo
          {summary.foil_count > 0 && ` · ${summary.foil_count} foil ✨`}
        </p>
      </div>
      <AnimatedBar percent={percent} className="mt-2 h-2" />

      {cards.length > 0 ? (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {cards.map((card, index) => (
            <li
              key={card.card_id}
              className="fade-up w-28 shrink-0 sm:w-32"
              style={{ "--i": Math.min(index, 8) } as CSSProperties}
            >
              <StickerCard card={card} foil={card.foil} photo={photos[card.card_id] ?? null} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Todavía no tenés cartas. Jugá el{" "}
          <Link to="/juego" className="font-semibold text-primary hover:underline">
            juego diario
          </Link>{" "}
          y abrí tu primer sobre.
        </p>
      )}
    </section>
  );
}