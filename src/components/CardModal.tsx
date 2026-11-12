import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { StickerCard } from "@/components/StickerCard";
import { KIND_LABELS, RARITY_LABELS, type AlbumEntry } from "@/lib/album";
import type { DriverPhoto } from "@/lib/f1";

export function CardModal({
  entry,
  photo,
  onClose,
}: {
  entry: AlbumEntry;
  photo: DriverPhoto | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={entry.name}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-300 motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto w-full max-w-[17rem]">
          <StickerCard card={entry} foil={entry.foil_quantity > 0} photo={photo} />
        </div>

        <div className="space-y-1 rounded-2xl border bg-card p-4 text-sm">
          <p className="font-display text-xl font-bold uppercase">{entry.name}</p>
          <p className="text-muted-foreground">
            {KIND_LABELS[entry.kind]} · {RARITY_LABELS[entry.rarity]} · #{String(entry.number).padStart(2, "0")}
          </p>
          <p>
            Tenés <span className="font-semibold">{entry.quantity}</span> normal{entry.quantity === 1 ? "" : "es"} y{" "}
            <span className="font-semibold">{entry.foil_quantity}</span> foil ✨
          </p>
          {photo && (
            <p className="text-xs text-muted-foreground">
              Foto:{" "}
              <a href={photo.page} target="_blank" rel="noopener noreferrer" className="underline">
                Wikipedia
              </a>
            </p>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            Próximamente: intercambiar con amigos y reciclar repetidas.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-background/80 p-2 backdrop-blur transition active:scale-90 hover:bg-background motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <X className="h-5 w-5" />
      </button>
    </div>,
    document.body,
  );
}