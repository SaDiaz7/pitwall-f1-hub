import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { KIND_LABELS, KIND_ORDER, RARITY_LABELS } from "@/lib/album";
import { cn } from "@/lib/utils";

type CardRow = {
  id: string;
  kind: string;
  season: number;
  name: string;
  rarity: string;
  active: boolean;
};

type AdminCollection = {
  id: string;
  name: string;
  description: string | null;
  card_ids: string[];
  reward_outcome: string;
  position: number;
  active: boolean;
  claims: number;
};

type CollectionsPayload = { collections: AdminCollection[]; outcomes: string[] };

type Status = { type: "ok" | "error"; text: string } | null;

type FormState = {
  id: string; // vacío = colección nueva
  name: string;
  description: string;
  reward: string;
  position: string;
  active: boolean;
  cardIds: string[];
};

const MAX_CARDS = 60;
const DEFAULT_OUTCOMES = ["collection_small", "collection_medium", "collection_big"];

const SELECT_CLASS =
  "h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

function kindLabel(kind: string): string {
  return (KIND_LABELS as Record<string, string | undefined>)[kind] ?? kind;
}

function rarityLabel(rarity: string): string {
  return (RARITY_LABELS as Record<string, string | undefined>)[rarity] ?? rarity;
}

function newForm(): FormState {
  return { id: "", name: "", description: "", reward: "collection_medium", position: "0", active: false, cardIds: [] };
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={cn(
        "rounded-md p-2 text-xs",
        status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {status.text}
    </p>
  );
}

export function AdminCollections() {
  const [data, setData] = useState<CollectionsPayload | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(newForm);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [collectionsResult, cardsResult] = await Promise.all([
      supabase.rpc("admin_album_list_collections"),
      supabase.rpc("admin_album_list_cards"),
    ]);

    if (collectionsResult.error || cardsResult.error) {
      console.error("Cargar colecciones (admin):", collectionsResult.error ?? cardsResult.error);
      setError("No pudimos cargar las colecciones. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setData(collectionsResult.data as unknown as CollectionsPayload);
    setCards(cardsResult.data as unknown as CardRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cardsById = new Map(cards.map((card) => [card.id, card]));

  const outcomes = [...(data?.outcomes.length ? data.outcomes : DEFAULT_OUTCOMES)].sort((a, b) => {
    const aFirst = a.startsWith("collection_") ? 0 : 1;
    const bFirst = b.startsWith("collection_") ? 0 : 1;
    return aFirst - bFirst || a.localeCompare(b);
  });

  // ---- Cartas de la colección ----
  const toggleCard = (id: string) =>
    setForm((prev) => {
      if (prev.cardIds.includes(id)) return { ...prev, cardIds: prev.cardIds.filter((value) => value !== id) };
      if (prev.cardIds.length >= MAX_CARDS) return prev;
      return { ...prev, cardIds: [...prev.cardIds, id] };
    });

  const term = search.trim().toLowerCase();
  const filteredCards = cards.filter((card) => {
    if (kindFilter !== "all" && card.kind !== kindFilter) return false;
    if (seasonFilter.trim() !== "" && String(card.season) !== seasonFilter.trim()) return false;
    if (term === "") return true;
    return `${card.name} ${card.id}`.toLowerCase().includes(term);
  });
  const shownCards = filteredCards.slice(0, 60);

  const addFiltered = () =>
    setForm((prev) => {
      const next = [...prev.cardIds];
      for (const card of filteredCards) {
        if (next.length >= MAX_CARDS) break;
        if (!next.includes(card.id)) next.push(card.id);
      }
      return { ...prev, cardIds: next };
    });

  // ---- Acciones ----
  const startEdit = (collection: AdminCollection) => {
    setForm({
      id: collection.id,
      name: collection.name,
      description: collection.description ?? "",
      reward: collection.reward_outcome,
      position: String(collection.position),
      active: collection.active,
      cardIds: collection.card_ids,
    });
    setStatus(null);
  };

  const onSave = async () => {
    setStatus(null);

    const name = form.name.trim();
    const position = Number(form.position.trim() === "" ? "0" : form.position.trim());

    if (name === "") {
      setStatus({ type: "error", text: "Falta el nombre de la colección." });
      return;
    }
    if (form.cardIds.length < 2) {
      setStatus({ type: "error", text: "Elegí al menos 2 cartas para la colección." });
      return;
    }
    if (!Number.isInteger(position)) {
      setStatus({ type: "error", text: "El orden tiene que ser un número entero." });
      return;
    }

    const payload = {
      ...(form.id !== "" ? { id: form.id } : {}),
      name,
      description: form.description.trim() === "" ? null : form.description.trim(),
      card_ids: form.cardIds,
      reward_outcome: form.reward,
      position,
      active: form.active,
    };

    setSaving(true);
    const { error: rpcError } = await supabase.rpc("admin_album_save_collection", {
      p_collection: payload as unknown as Json,
    });
    setSaving(false);

    if (rpcError) {
      console.error("Guardar colección:", rpcError);
      setStatus({ type: "error", text: `No pudimos guardar: ${rpcError.message}` });
      return;
    }

    setStatus({
      type: "ok",
      text: form.id === "" ? "Colección creada. Queda inactiva hasta que la actives." : "Cambios guardados.",
    });
    if (form.id === "") setForm(newForm());
    await load();
  };

  const toggleActive = async (collection: AdminCollection) => {
    setBusyId(collection.id);
    const { error: rpcError } = await supabase.rpc("admin_album_save_collection", {
      p_collection: {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        card_ids: collection.card_ids,
        reward_outcome: collection.reward_outcome,
        position: collection.position,
        active: !collection.active,
      } as unknown as Json,
    });
    setBusyId(null);

    if (rpcError) {
      console.error("Activar colección:", rpcError);
      setStatus({ type: "error", text: `No pudimos cambiar el estado: ${rpcError.message}` });
      return;
    }
    await load();
  };

  const onDelete = async (collection: AdminCollection) => {
    if (!window.confirm(`¿Borrar la colección "${collection.name}"? No se puede deshacer.`)) return;

    setBusyId(collection.id);
    const { error: rpcError } = await supabase.rpc("admin_album_delete_collection", { p_id: collection.id });
    setBusyId(null);

    if (rpcError) {
      console.error("Borrar colección:", rpcError);
      setStatus({ type: "error", text: rpcError.message });
      return;
    }

    if (form.id === collection.id) setForm(newForm());
    setStatus({ type: "ok", text: "Colección borrada." });
    await load();
  };

  const collections = data?.collections ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Colecciones</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Series de cartas que dan un sobre al completarlas. Una colección nueva queda inactiva hasta que la actives.
            Para editar el tamaño del sobre, usá las reglas <code>collection_*</code> en Economía.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {/* Lista */}
      {loading && !data ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="skeleton h-24" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Todavía no hay colecciones.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
          {collections.map((collection, index) => (
            <li
              key={collection.id}
              className={cn("fade-up space-y-2 rounded-xl border bg-card p-3", !collection.active && "opacity-70")}
              style={stagger(Math.min(index, 8))}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{collection.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {collection.card_ids.length} cartas · {collection.claims}{" "}
                  {collection.claims === 1 ? "reclamo" : "reclamos"}
                </p>
              </div>
              {!collection.active && (
                <span className="inline-block rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-destructive">
                  Inactiva
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(collection)}
                  className="transition-transform active:scale-95"
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === collection.id}
                  onClick={() => void toggleActive(collection)}
                  className="transition-transform active:scale-95"
                >
                  {collection.active ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyId === collection.id}
                  onClick={() => void onDelete(collection)}
                  className="transition-transform active:scale-95"
                >
                  Borrar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Formulario */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="fade-up space-y-4 rounded-2xl border bg-card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {form.id === "" ? "Colección nueva" : "Editar colección"}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Nombre</Label>
              <Input value={form.name} onChange={(ev) => setForm((prev) => ({ ...prev, name: ev.target.value }))} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={(ev) => setForm((prev) => ({ ...prev, description: ev.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Recompensa</Label>
              <select
                value={form.reward}
                onChange={(ev) => setForm((prev) => ({ ...prev, reward: ev.target.value }))}
                className={SELECT_CLASS}
              >
                {outcomes.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Orden</Label>
              <Input
                value={form.position}
                inputMode="numeric"
                onChange={(ev) => setForm((prev) => ({ ...prev, position: ev.target.value }))}
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(ev) => setForm((prev) => ({ ...prev, active: ev.target.checked }))}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Activa (la ven todos los jugadores)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cartas elegidas · {form.cardIds.length}/{MAX_CARDS}
            </p>
            {form.cardIds.length === 0 ? (
              <p className="text-xs text-muted-foreground">Todavía no elegiste ninguna. Buscalas a la derecha.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {form.cardIds.map((id) => {
                  const card = cardsById.get(id);
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => toggleCard(id)}
                        title="Quitar"
                        className="rounded-full border bg-secondary/40 px-2.5 py-1 text-xs font-semibold transition hover:bg-destructive/15 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
                      >
                        {card ? card.name : id} ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <StatusLine status={status} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={() => void onSave()}
              className="bg-gradient-primary font-semibold transition-transform active:scale-95"
            >
              {saving ? "Guardando…" : form.id === "" ? "Crear colección" : "Guardar cambios"}
            </Button>
            {form.id !== "" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(newForm());
                  setStatus(null);
                }}
                className="transition-transform active:scale-95"
              >
                Cargar una nueva
              </Button>
            )}
          </div>
        </section>

        {/* Selector de cartas */}
        <section className="fade-up space-y-3 rounded-2xl border bg-card p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider">Buscar cartas</h3>

          <div className="grid grid-cols-2 gap-2">
            <Input
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Nombre o id…"
              className="col-span-2 h-9"
            />
            <select value={kindFilter} onChange={(ev) => setKindFilter(ev.target.value)} className={SELECT_CLASS}>
              <option value="all">Todos los tipos</option>
              {KIND_ORDER.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel(kind)}
                </option>
              ))}
            </select>
            <Input
              value={seasonFilter}
              inputMode="numeric"
              onChange={(ev) => setSeasonFilter(ev.target.value)}
              placeholder="Temporada (ej. 2026)"
              className="h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={filteredCards.length === 0}
              onClick={addFiltered}
              className="transition-transform active:scale-95"
            >
              Agregar las {filteredCards.length} del filtro
            </Button>
            <span className="text-xs text-muted-foreground">
              {filteredCards.length > shownCards.length && `Mostrando ${shownCards.length}. `}Tocá una carta para
              agregarla o quitarla.
            </span>
          </div>

          <ul className="grid max-h-96 grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-1.5 overflow-y-auto pr-1">
            {shownCards.map((card) => {
              const selected = form.cardIds.includes(card.id);
              return (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => toggleCard(card.id)}
                    aria-pressed={selected}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-1.5 text-left transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
                      selected ? "border-primary/60 bg-primary/15" : "bg-background/40 hover:bg-accent/40",
                    )}
                  >
                    <p className="truncate text-xs font-bold">{card.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {kindLabel(card.kind)} · {card.season} · {rarityLabel(card.rarity)}
                      {!card.active && " · inactiva"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}