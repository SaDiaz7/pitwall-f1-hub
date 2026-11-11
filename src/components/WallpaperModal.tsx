import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Pencil, Trash2, X } from "lucide-react";
import { WallpaperEditForm } from "@/components/WallpaperEditForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/hooks/useProfile";
import { uploaderName, type WallpaperUploader } from "@/hooks/useWallpaperUploaders";
import {
  ORIENTATION_LABELS,
  deleteWallpaper,
  getDownloadUrl,
  getWallpaperUrls,
  orientationOf,
  qualityLabel,
  type Wallpaper,
} from "@/lib/wallpapers";

function UploaderLine({ uploader, linked }: { uploader: WallpaperUploader; linked: boolean }) {
  const name = uploaderName(uploader);
  const content = (
    <>
      <Avatar className="h-6 w-6">
        {uploader.avatar_url && <AvatarImage src={uploader.avatar_url} alt="" />}
        <AvatarFallback className="bg-secondary text-[10px] font-bold">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <span className="font-semibold text-foreground">{name}</span>
    </>
  );

  return (
    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      Subido por
      {linked ? (
        <Link
          to="/usuario/$id"
          params={{ id: uploader.user_id }}
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          {content}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5">{content}</span>
      )}
    </p>
  );
}

export function WallpaperModal({
  wallpaper,
  isAdmin,
  canDownload = true,
  uploader = null,
  onClose,
  onDeleted,
  onUpdated,
}: {
  wallpaper: Wallpaper;
  isAdmin: boolean;
  canDownload?: boolean;
  uploader?: WallpaperUploader | null;
  onClose: () => void;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-4xl space-y-4 overflow-y-auto rounded-2xl border bg-card p-4 animate-in zoom-in-95 duration-200 motion-reduce:animate-none md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {[
                wallpaper.driver_name ? wallpaper.team_name : null,
                wallpaper.year,
                qualityLabel(wallpaper.quality),
                ORIENTATION_LABELS[orientationOf(wallpaper.width, wallpaper.height)],
              ]
                .filter(Boolean)
                .join(" · ")}{" "}
              · {wallpaper.width} × {wallpaper.height} px
            </p>
            {wallpaper.credit && <p className="mt-1 text-xs text-muted-foreground">Crédito: {wallpaper.credit}</p>}
            {uploader && <UploaderLine uploader={uploader} linked={canDownload} />}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-lg p-2 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <img
          src={canDownload ? urls.full : urls.thumb}
          alt={title}
          className="max-h-[60vh] w-full rounded-xl object-contain"
        />

        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

        {editing ? (
          <WallpaperEditForm
            wallpaper={wallpaper}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onUpdated();
            }}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            {canDownload ? (
              <a
                href={getDownloadUrl(wallpaper)}
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
              >
                <Download className="h-4 w-4" /> Descargar
              </a>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
              >
                <Download className="h-4 w-4" /> Iniciá sesión para descargar
              </Link>
            )}
            {isAdmin && (
              <>
                <Button type="button" variant="outline" onClick={() => setEditing(true)} className="transition-transform active:scale-95">
                  <Pencil className="mr-2 h-4 w-4" /> Editar
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={handleDelete} className="transition-transform active:scale-95">
                  <Trash2 className="mr-2 h-4 w-4" /> {busy ? "Borrando…" : "Borrar"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}