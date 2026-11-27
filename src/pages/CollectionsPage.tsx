import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Gift } from "lucide-react";
import { AlbumNav } from "@/components/AlbumNav";
import { AnimatedBar } from "@/components/AnimatedBar";
import { CardModal } from "@/components/CardModal";
import { PackReveal } from "@/components/DailyPack";
import { PageHeader } from "@/components/PageHeader";
import { EmptySlot, StickerCard } from "@/components/StickerCard";
import { Button } from "@/components/ui/button";
import { useAlbum } from "@/hooks/useAlbum";
import { useCollections } from "@/hooks/useCollections";
import type { AlbumCard, AlbumEntry } from "@/lib/album";
import type { Collection } from "@/lib/collections";

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

const isClaimable = (collection: Collection) =>
  !collection.claimed && collection.card_ids.length > 0 && collection.owned >= collection.card_ids.length;

function CollectionSection({
  collection,
  entries,
  index,
  claiming,
  onClaim,
  onOpen,
}: {
  collection: Collection;
  entries: Map<string, AlbumEntry>;
  index: number;
  claiming: boolean;
  onClaim: () => void;
  onOpen: (entry: AlbumEntry) => void;
}) {
  const total = collection.card_ids.length;
  const complete = total > 0 && collection.owned >= total;
  const percent = total > 0 ? Math.round((collection.owned / total) * 100) : 0;
  const missing = total - collection.owned;

  return (
    <section className="fade-up space-y-4 rounded-2xl border bg-card p-4" style={stagger(Math.min(index, 6))}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-display text-2xl font-bold uppercase leading-none">{collection.name}</h2>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {collection.owned}/{total}
          </span>
        </div>

        {collection.description && <p className="text-sm text-muted-foreground">{collection.description}</p>}

        <AnimatedBar percent={percent} className="h-2 max-w-sm" />

        <p className="text-xs text-muted-foreground">
          Recompensa: sobre de {collection.reward_count ?? "varias"} cartas
        </p>

        {collection.claimed ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <Check className="h-4 w-4" /> Recompensa reclamada
          </p>
        ) : complete ? (
          <Button
            type="button"
            disabled={claiming}
            onClick={onClaim}
            className="bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            <Gift className="mr-2 h-4 w-4" />
            {claiming ? "Abriendo…" : "Reclamar sobre"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Te {missing === 1 ? "falta 1 carta" : `faltan ${missing} cartas`} para completarla.
          </p>
        )}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {collection.card_ids.map((cardId) => {
          const entry = entries.get(cardId);
          if (!entry) return null;
          const have = entry.quantity + entry.foil_quantity > 0;

          return (
            <li key={cardId}>
              {have ? (
                <button
                  type="button"
                  onClick={() => onOpen(entry)}
                  aria-label={entry.name}
                  className="block w-full rounded-[7%] transition-transform hover:-translate-y-1 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                >
                  <StickerCard card={entry} foil={entry.foil_quantity > 0} />
                </button>
              ) : (
                <div className="opacity-70" title={entry.name}>
                  <EmptySlot number={entry.number} kind={entry.kind} rarity={entry.rarity} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function CollectionsPage() {
  const { entries, loading: albumLoading, reload: reloadAlbum } = useAlbum();
  const { collections, loading, error, claim } = useCollections();

  const [selected, setSelected] = useState<AlbumEntry | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [reward, setReward] = useState<{ name: string; cards: AlbumCard[] } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const rewardRef = useRef<HTMLDivElement | null>(null);

  // Cuando se abre una recompensa, se baja hasta ella.
  useEffect(() => {
    if (!reward) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rewardRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [reward]);

  const byId = new Map(entries.map((entry) => [entry.card_id, entry]));

  // Las que ya podés reclamar van primero.
  const sorted = [...collections].sort((a, b) => Number(isClaimable(b)) - Number(isClaimable(a)));

  const onClaim = async (collection: Collection) => {
    setClaimingId(collection.id);
    setMessage(null);
    const response = await claim(collection.id);
    setClaimingId(null);

    if (!response.ok) {
      setMessage(response.message);
      return;
    }
    setReward({ name: collection.name, cards: response.cards });
    void reloadAlbum();
  };

  return (
    <>
      <PageHeader title="Colecciones" subtitle="Completá series de cartas y ganá sobres de recompensa." />

      <AlbumNav />

      {(message || error) && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{message ?? error}</p>
      )}

      {reward && (
        <div ref={rewardRef} className="fade-up mb-6 max-w-5xl space-y-3 rounded-2xl border border-primary/50 bg-hero p-5">
          <PackReveal key={reward.name} cards={reward.cards} title={`Recompensa: ${reward.name}`} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setReward(null)}
            className="transition-transform active:scale-95"
          >
            Cerrar
          </Button>
        </div>
      )}

      {loading || albumLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="skeleton h-64" />
          <div className="skeleton h-64" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="max-w-xl rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay colecciones. ¡Pronto vas a poder completar series de cartas y ganar sobres!
        </div>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {sorted.map((collection, index) => (
            <CollectionSection
              key={collection.id}
              collection={collection}
              entries={byId}
              index={index}
              claiming={claimingId === collection.id}
              onClaim={() => void onClaim(collection)}
              onOpen={setSelected}
            />
          ))}
        </div>
      )}

      {selected && <CardModal entry={selected} onClose={() => setSelected(null)} />}
    </>
  );
}