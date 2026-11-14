import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X } from "lucide-react";
import { StickerCard } from "@/components/StickerCard";
import { KIND_LABELS, RARITY_LABELS, cardImageUrl, type AlbumEntry } from "@/lib/album";
import { renderCardImage, shareImageBlob } from "@/lib/card-share";
import { Link } from "@tanstack/react-router";

export function CardModal({
  entry,
  onClose,
}: {
  entry: AlbumEntry;
  onClose: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const onShare = async () => {
    setSharing(true);
    setMessage(null);
    try {
      const blob = await renderCardImage(entry, entry.foil_quantity > 0, cardImageUrl(entry));
      const filename = `pitwall-carta-${entry.card_id.replace(/[^a-z0-9]+/gi, "-")}.png`;
      const text = `Me salió ${entry.name} (${RARITY_LABELS[entry.rarity]}) en PitWall ${window.location.origin}`;
      const result = await shareImageBlob(blob, filename, text);
      if (result === "downloaded") setMessage("Imagen descargada.");
    } catch (error) {
      // Si la persona cierra el menú de compartir no es un error.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Compartir carta:", error);
        setMessage("No pudimos generar la imagen.");
      }
    } finally {
      setSharing(false);
    }
  };

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
          <StickerCard card={entry} foil={entry.foil_quantity > 0} />
        </div>

        <div className="space-y-2 rounded-2xl border bg-card p-4 text-sm">
          <p className="font-display text-xl font-bold uppercase">{entry.name}</p>
          <p className="text-muted-foreground">
            {KIND_LABELS[entry.kind]} · {RARITY_LABELS[entry.rarity]} · #{String(entry.number).padStart(2, "0")}
          </p>
          <p>
            Tenés <span className="font-semibold">{entry.quantity}</span> normal{entry.quantity === 1 ? "" : "es"} y{" "}
            <span className="font-semibold">{entry.foil_quantity}</span> foil ✨
          </p>

          {message && <p className="rounded-md bg-secondary p-2 text-xs">{message}</p>}

          <button
            type="button"
            onClick={() => void onShare()}
            disabled={sharing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
          >
            <Share2 className="h-4 w-4" />
            {sharing ? "Generando imagen…" : "Compartir carta"}
          </button>

          <Link
            to="/repetidas"
            onClick={onClose}
            className="block pt-1 text-xs font-semibold text-primary hover:underline"
          >
            Reciclar o intercambiar repetidas →
          </Link>
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