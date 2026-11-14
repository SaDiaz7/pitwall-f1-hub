import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatedBar } from "@/components/AnimatedBar";
import { CardModal } from "@/components/CardModal";
import { PageHeader } from "@/components/PageHeader";
import { EmptySlot, StickerCard } from "@/components/StickerCard";
import { useAlbum } from "@/hooks/useAlbum";
import { KIND_LABELS, KIND_ORDER, type AlbumEntry, type CardKind } from "@/lib/album";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AlbumNav } from "@/components/AlbumNav";

type KindFilter = "all" | CardKind;
type ModeFilter = "all" | "missing" | "duplicates" | "foil";

const MODES: { value: ModeFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "missing", label: "Me faltan" },
  { value: "duplicates", label: "Repetidas" },
  { value: "foil", label: "Foil ✨" },
];

const KIND_PLURAL: Record<CardKind, string> = { driver: "Pilotos", team: "Escuderías", circuit: "Circuitos" };

const owned = (entry: AlbumEntry) => entry.quantity + entry.foil_quantity > 0;
const total = (entry: AlbumEntry) => entry.quantity + entry.foil_quantity;

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
        active ? "border-primary/60 bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Summary({ label, value, index }: { label: string; value: string; index: number }) {
  return (
    <div className="fade-up rounded-2xl border bg-card p-4" style={{ "--i": index } as CSSProperties}>
      <p className="font-display text-3xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export function AlbumPage() {
  const { entries, loading, error } = useAlbum();
  const [kind, setKind] = useState<KindFilter>("all");
  const [mode, setMode] = useState<ModeFilter>("all");
  const [selected, setSelected] = useState<AlbumEntry | null>(null);
  const isAdmin = useIsAdmin();
  const [preview, setPreview] = useState(false);
  const [previewFoil, setPreviewFoil] = useState(false);

  const ownedCount = entries.filter(owned).length;
  const duplicates = entries.reduce((sum, entry) => sum + Math.max(0, total(entry) - 1), 0);
  const foils = entries.filter((entry) => entry.foil_quantity > 0).length;
  const legendaries = entries.filter(
    (entry) => (entry.rarity === "legendary" || entry.rarity === "mythic") && owned(entry),
  ).length;
  const percent = entries.length > 0 ? Math.round((ownedCount / entries.length) * 100) : 0;

  // Vista previa de admin: muestra todas las cartas como si las tuvieras (no se guarda nada).
  const shown = preview
    ? entries.map((entry) => ({
        ...entry,
        quantity: previewFoil ? entry.quantity : Math.max(entry.quantity, 1),
        foil_quantity: previewFoil ? Math.max(entry.foil_quantity, 1) : entry.foil_quantity,
      }))
    : entries;

  const visible = shown.filter((entry) => {
    if (kind !== "all" && entry.kind !== kind) return false;
    if (mode === "missing") return !owned(entry);
    if (mode === "duplicates") return total(entry) > 1;
    if (mode === "foil") return entry.foil_quantity > 0;
    return true;
  });

  return (
    <>
      <PageHeader title="Álbum" subtitle="Tu colección de cartas. Ganá sobres jugando todos los días al juego diario." />

      <AlbumNav />

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-28 max-w-3xl" />
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-3">
            {Array.from({ length: 12 }, (_, index) => (
              <li key={index} className="skeleton aspect-[5/7]" />
            ))}
          </ul>
        </div>
      ) : entries.length === 0 ? (
        <div className="max-w-xl rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay cartas en el catálogo. Un administrador tiene que sincronizarlas desde Ajustes → Álbum.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="fade-up rounded-2xl border bg-card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-3xl font-bold tabular-nums">
                  {ownedCount}
                  <span className="text-lg text-muted-foreground"> / {entries.length}</span>
                </p>
                <p className="text-sm font-semibold text-muted-foreground">{percent}% completo</p>
              </div>
              <AnimatedBar percent={percent} className="mt-2 h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Summary index={1} label="Repetidas" value={String(duplicates)} />
              <Summary index={2} label="Con foil" value={String(foils)} />
              <Summary index={3} label="Legendarias y Míticas" value={String(legendaries)} />
            </div>

            {ownedCount === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no tenés cartas. Jugá el{" "}
                <Link to="/juego" className="font-semibold text-primary hover:underline">
                  juego diario
                </Link>{" "}
                y abrí tu primer sobre.
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-3 text-sm">
              <span className="font-semibold">Admin</span>
              <Pill active={preview} onClick={() => setPreview((value) => !value)}>
                Ver todas las cartas
              </Pill>
              {preview && (
                <Pill active={previewFoil} onClick={() => setPreviewFoil((value) => !value)}>
                  Con foil ✨
                </Pill>
              )}
              {preview && <span className="text-xs text-muted-foreground">Vista previa: no se guarda nada.</span>}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Pill active={kind === "all"} onClick={() => setKind("all")}>
                Todas {ownedCount}/{entries.length}
              </Pill>
              {KIND_ORDER.map((value) => {
                const ofKind = entries.filter((entry) => entry.kind === value);
                return (
                  <Pill key={value} active={kind === value} onClick={() => setKind(value)}>
                    {KIND_PLURAL[value]} {ofKind.filter(owned).length}/{ofKind.length}
                  </Pill>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {MODES.map((option) => (
                <Pill key={option.value} active={mode === option.value} onClick={() => setMode(option.value)}>
                  {option.label}
                </Pill>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
              No hay cartas con ese filtro todavía.
            </p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10.5rem),1fr))] gap-3">
              {visible.map((entry, index) => (
                <li key={entry.card_id} className="fade-up" style={{ "--i": Math.min(index, 10) } as CSSProperties}>
                  {owned(entry) ? (
                    <button
                      type="button"
                      onClick={() => setSelected(entry)}
                      aria-label={`${entry.name}, ${KIND_LABELS[entry.kind]}`}
                      className="block w-full rounded-[7%] transition-transform hover:-translate-y-1 active:scale-95 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                    >
                      <StickerCard
                        card={entry}
                        foil={entry.foil_quantity > 0}
                        quantity={total(entry)}
                      />
                    </button>
                  ) : (
                    <EmptySlot number={entry.number} kind={entry.kind} rarity={entry.rarity} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selected && (
        <CardModal
          entry={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}