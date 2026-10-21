import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WallpaperUploadForm } from "@/components/WallpaperUploadForm";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useWallpapers } from "@/hooks/useWallpapers";
import {
  deleteWallpaper,
  getDownloadUrl,
  getWallpaperUrls,
  qualityLabel,
  type Wallpaper,
} from "@/lib/wallpapers";

interface Filters {
  year: string;
  team: string;
  driver: string;
  quality: string;
}

const EMPTY_FILTERS: Filters = { year: "", team: "", driver: "", quality: "" };
const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";

function uniqueOptions(items: { id: string | null; name: string | null }[]) {
  const map = new Map<string, string>();
  for (const item of items) {
    if (item.id && !map.has(item.id)) map.set(item.id, item.name ?? item.id);
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS}>
        {children}
      </select>
    </label>
  );
}

function WallpaperModal({
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
              {[
                wallpaper.driver_name ? wallpaper.team_name : null,
                wallpaper.year,
                qualityLabel(wallpaper.quality),
              ]
                .filter(Boolean)
                .join(" · ")}{" "}
              · {wallpaper.width} × {wallpaper.height} px
            </p>
            {wallpaper.credit && (
              <p className="mt-1 text-xs text-muted-foreground">Crédito: {wallpaper.credit}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <img
          src={urls.full}
          alt={title}
          className="max-h-[60vh] w-full rounded-xl object-contain"
        />

        {error && (
          <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
        )}

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

export function WallpapersPage() {
  const isAdmin = useIsAdmin();
  const { wallpapers, loading, error, reload } = useWallpapers();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<Wallpaper | null>(null);

  // Las opciones de los filtros salen de los fondos que ya existen.
  const options = useMemo(
    () => ({
      years: [...new Set(wallpapers.map((w) => w.year))].sort((a, b) => b - a),
      teams: uniqueOptions(wallpapers.map((w) => ({ id: w.team_id, name: w.team_name }))),
      drivers: uniqueOptions(wallpapers.map((w) => ({ id: w.driver_id, name: w.driver_name }))),
    }),
    [wallpapers],
  );

  const filtered = useMemo(
    () =>
      wallpapers.filter(
        (w) =>
          (!filters.year || String(w.year) === filters.year) &&
          (!filters.team || w.team_id === filters.team) &&
          (!filters.driver || w.driver_id === filters.driver) &&
          (!filters.quality || w.quality === filters.quality),
      ),
    [wallpapers, filters],
  );

  const hasFilters = Object.values(filters).some(Boolean);
  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader title="Fondos" subtitle="Fondos de pantalla de pilotos y equipos de la F1." />

      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="bg-gradient-primary font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> {showUpload ? "Cerrar" : "Subir fondo"}
          </Button>
        </div>
      )}

      {isAdmin && showUpload && <WallpaperUploadForm onUploaded={reload} />}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect label="Año" value={filters.year} onChange={setFilter("year")}>
          <option value="">Todos</option>
          {options.years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Equipo" value={filters.team} onChange={setFilter("team")}>
          <option value="">Todos</option>
          {options.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Piloto" value={filters.driver} onChange={setFilter("driver")}>
          <option value="">Todos</option>
          {options.drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Calidad" value={filters.quality} onChange={setFilter("quality")}>
          <option value="">Todas</option>
          <option value="4k">4K</option>
          <option value="hd">HD</option>
          <option value="sd">Baja</option>
        </FilterSelect>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando fondos…</p>
      ) : wallpapers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Todavía no hay fondos cargados.
          {isAdmin ? " Usá el botón “Subir fondo” para agregar el primero." : ""}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          No hay fondos con esos filtros.{" "}
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="font-semibold text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "fondo" : "fondos"}
            {hasFilters && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="font-semibold text-primary hover:underline"
                >
                  Limpiar filtros
                </button>
              </>
            )}
          </p>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => setSelected(w)}
                  className="group relative block w-full overflow-hidden rounded-2xl border bg-card text-left"
                >
                  <img
                    src={getWallpaperUrls(w.id).thumb}
                    alt={w.driver_name ?? w.team_name ?? "Fondo"}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold backdrop-blur">
                    {qualityLabel(w.quality)}
                  </span>
                  <div className="p-3">
                    <p className="truncate font-semibold">
                      {w.driver_name ?? w.team_name ?? "Fondo"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[w.driver_name ? w.team_name : null, w.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selected && (
        <WallpaperModal
          wallpaper={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            setSelected(null);
            reload();
          }}
        />
      )}
    </>
  );
}
