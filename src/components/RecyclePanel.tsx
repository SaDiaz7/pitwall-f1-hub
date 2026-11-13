import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { StickerCard } from "@/components/StickerCard";
import { supabase } from "@/integrations/supabase/client";
import { RARITY_LABELS, RARITY_RANK, type Rarity } from "@/lib/album";
import { albumError, type RecycleInfo, type RecycleResult } from "@/lib/album-trades";
import { cn } from "@/lib/utils";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];

const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-zinc-300",
  rare: "text-sky-300",
  epic: "text-purple-300",
  legendary: "text-amber-300",
};

export function RecyclePanel() {
  const [info, setInfo] = useState<RecycleInfo | null>(null);
  const [busy, setBusy] = useState<Rarity | null>(null);
  const [result, setResult] = useState<RecycleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("album_get_recycle_info");
    if (rpcError) {
      console.error("Info de reciclaje:", rpcError);
      setError("No pudimos cargar tus repetidas.");
      return;
    }
    setInfo(data as unknown as RecycleInfo);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recycle = async (rarity: Rarity) => {
    if (!info) return;
    if (!window.confirm(`¿Reciclar ${info.cost} repetidas de rareza ${RARITY_LABELS[rarity]}? No se puede deshacer.`)) {
      return;
    }

    setBusy(rarity);
    setError(null);
    setResult(null);

    const { data, error: rpcError } = await supabase.rpc("album_recycle", { p_rarity: rarity });
    setBusy(null);

    if (rpcError) {
      console.error("Reciclar:", rpcError);
      setError(albumError(rpcError, "No pudimos reciclar. Probá de nuevo."));
      await load();
      return;
    }

    setResult(data as unknown as RecycleResult);
    await load();
  };

  if (!info) {
    return error ? (
      <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
    ) : (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-3">
        {RARITIES.map((rarity) => (
          <li key={rarity} className="skeleton h-44" />
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Juntá {info.cost} repetidas de una misma rareza y cambialas por 1 carta nueva de esa rareza o mejor. Siempre te
        queda 1 copia de cada carta, y las foil no se reciclan.
      </p>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {result && (
        <section className="fade-up flex flex-wrap items-center gap-5 rounded-2xl border border-primary/50 bg-hero p-5">
          <div className="pack-pop w-36 shrink-0">
            <StickerCard card={result.card} foil={result.card.foil} />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Resultado del reciclaje</p>
            <p className="font-display text-2xl font-bold uppercase">{result.card.name}</p>
            <p className="text-sm text-muted-foreground">
              Cambiaste {info.cost} repetidas {RARITY_LABELS[result.from]}s por una carta {RARITY_LABELS[result.to]}
              {result.card.foil ? " con foil ✨" : ""}.
            </p>
            {result.to !== result.from && <p className="text-sm font-semibold text-primary">¡Subiste de rareza!</p>}
            {result.card.is_new && (
              <span className="inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">
                ¡Nueva!
              </span>
            )}
          </div>
        </section>
      )}

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-3">
        {RARITIES.map((rarity, index) => {
          const have = info.available[rarity] ?? 0;
          const odds = (Object.entries(info.odds[rarity] ?? {}) as [Rarity, number][]).sort(
            (a, b) => RARITY_RANK[a[0]] - RARITY_RANK[b[0]],
          );
          const enough = have >= info.cost;

          return (
            <li
              key={rarity}
              className="fade-up space-y-3 rounded-2xl border bg-card p-4"
              style={{ "--i": index } as CSSProperties}
            >
              <p className={cn("text-xs font-bold uppercase tracking-widest", RARITY_TEXT[rarity])}>
                {RARITY_LABELS[rarity]}
              </p>
              <p className="font-display text-3xl font-bold tabular-nums">
                {have} <span className="text-base font-normal text-muted-foreground">repetidas</span>
              </p>
              <AnimatedBar percent={Math.min(100, (have / info.cost) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resultado: {odds.map(([target, pct]) => `${pct}% ${RARITY_LABELS[target].toLowerCase()}`).join(" · ")}
              </p>
              <button
                type="button"
                onClick={() => void recycle(rarity)}
                disabled={!enough || busy !== null}
                className="w-full rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition active:scale-95 disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                {busy === rarity ? "Reciclando…" : enough ? `Reciclar ${info.cost}` : `Faltan ${info.cost - have}`}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}