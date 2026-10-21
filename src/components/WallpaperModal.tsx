import { useEffect, useState } from "react";
import { Download, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteWallpaper, getDownloadUrl, getWallpaperUrls, qualityLabel, type Wallpaper } from "@/lib/wallpapers";

export function WallpaperModal({
  wallpaper,
  isAdmin,
  onClose,
  onDeleted,
}: {
  wallpaper: Wallpaper;
  isAdmin: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urls = getWallpaperUrls(wallpaper.id);
  const title = wallpaper.driver_name ?? wallpaper.team_name ?? "Fondo";

  // Cierra con la tecla Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDelete = async () => {
    if (!window.confirm("¿Borrar este fondo? No se puede deshacer.")) return;
    setBusy(true);
    const result = await deleteWallpaper(wallpaper.id);
    setBusy(false);
    if (result.ok) onDeleted();
    else setError(result.message);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-4xl space-y-4 overflow-y-auto rounded-2xl border bg-card p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {[wallpaper.driver_name ? wallpaper.team_name : null, wallpaper.year, qualityLabel(wallpaper.quality)]
                .filter(Boolean)
                .join(" · ")}{" "}
              · {wallpaper.width} × {wallpaper.height} px
            </p>
            {wallpaper.credit && <p className="mt-1 text-xs text-muted-foreground">Crédito: {wallpaper.credit}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <img src={urls.full} alt={title} className="max-h-[60vh] w-full rounded-xl object-contain" />

        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <a
            href={getDownloadUrl(wallpaper)}
            rel="noopener"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" /> Descargar
          </a>
          {isAdmin && (
            <Button type="button" variant="outline" disabled={busy} onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> {busy ? "Borrando…" : "Borrar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}