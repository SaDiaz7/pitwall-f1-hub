import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { WallpaperModal } from "@/components/WallpaperModal";
import { WallpaperUploadForm } from "@/components/WallpaperUploadForm";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "@tanstack/react-router";
import { getInitials } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { useWallpaperUploaders, uploaderName } from "@/hooks/useWallpaperUploaders";
import { useWallpapers } from "@/hooks/useWallpapers";
import {
  ORIENTATION_LABELS,
  getWallpaperUrls,
  orientationOf,
  qualityLabel,
  type Orientation,
} from "@/lib/wallpapers";
import { TeamStripe } from "@/components/TeamStripe";
import { LikeButton } from "@/components/LikeButton";
import { Pagination } from "@/components/Pagination";

interface Filters {
  year: string;
  team: string;
  driver: string;
  quality: string;
  format: string;
}

const EMPTY_FILTERS: Filters = { year: "", team: "", driver: "", quality: "", format: "" };
const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";
type SortOrder = "recent" | "most" | "least";
const PAGE_SIZE = 20; // fondos por página
const GRID = "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]";

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

export function WallpapersPage() {
  const isAdmin = useIsAdmin();
  const { session } = useSession();
  const navigate = useNavigate();
  const isGuest = !session;
  const { wallpapers, likedIds, loading, error, reload, toggleLike } = useWallpapers();
  const { uploaders, reload: reloadUploaders } = useWallpaperUploaders();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [page, setPage] = useState(1);
  const gridTopRef = useRef<HTMLParagraphElement>(null);

  // El fondo abierto se busca en la lista, así al editarlo se ve actualizado.
  const selected = selectedId ? (wallpapers.find((w) => w.id === selectedId) ?? null) : null;

  const reloadAll = () => {
    void reload();
    void reloadUploaders();
  };

  // Las opciones de los filtros salen de los fondos que ya existen.
  const options = useMemo(
    () => ({
      years: [...new Set(wallpapers.map((w) => w.year))].sort((a, b) => b - a),
      teams: uniqueOptions(wallpapers.map((w) => ({ id: w.team_id, name: w.team_name }))),
      drivers: uniqueOptions(wallpapers.map((w) => ({ id: w.driver_id, name: w.driver_name }))),
    }),
    [wallpapers],
  );

  const filtered = useMemo(() => {
    const result = wallpapers.filter(
      (w) =>
        (!filters.year || String(w.year) === filters.year) &&
        (!filters.team || w.team_id === filters.team) &&
        (!filters.driver || w.driver_id === filters.driver) &&
        (!filters.quality || w.quality === filters.quality) &&
        (!filters.format || orientationOf(w.width, w.height) === filters.format),
    );

    if (sort === "most") result.sort((a, b) => b.likes_count - a.likes_count);
    if (sort === "least") result.sort((a, b) => a.likes_count - b.likes_count);
    return result;
  }, [wallpapers, filters, sort]);

  // Vuelve a la página 1 cuando cambian los filtros o el orden.
  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(next);
    gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader title="Fondos" subtitle="Fondos de pantalla de pilotos y equipos de la F1." />

      {isGuest && (
        <p className="mb-4 rounded-md bg-primary/10 p-3 text-sm">
          Estás viendo los fondos como visitante.{" "}
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="font-semibold text-primary hover:underline"
          >
            Iniciá sesión
          </button>{" "}
          para dar likes y descargarlos.
        </p>
      )}

      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" /> {showUpload ? "Cerrar" : "Subir fondo"}
          </Button>
        </div>
      )}

      {isAdmin && showUpload && (
        <div className="max-w-3xl">
          <WallpaperUploadForm onUploaded={reloadAll} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-3">
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
        <FilterSelect label="Formato" value={filters.format} onChange={setFilter("format")}>
          <option value="">Todos</option>
          {(Object.keys(ORIENTATION_LABELS) as Orientation[]).map((key) => (
            <option key={key} value={key}>
              {ORIENTATION_LABELS[key]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Ordenar por" value={sort} onChange={(v) => setSort(v as SortOrder)}>
          <option value="recent">Más recientes</option>
          <option value="most">Más likes</option>
          <option value="least">Menos likes</option>
        </FilterSelect>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <ul className={GRID}>
          {Array.from({ length: 10 }, (_, index) => (
            <li key={index} className="skeleton aspect-[4/3]" />
          ))}
        </ul>
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
          <p ref={gridTopRef} className="mb-3 scroll-mt-4 text-sm text-muted-foreground">
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
          <ul className={GRID}>
            {visible.map((w, index) => {
              const name = w.driver_name ?? w.team_name ?? "Fondo";
              const uploader = w.uploaded_by ? uploaders.get(w.uploaded_by) : undefined;
              // Cada fondo conserva su proporción (con un límite para que ninguno quede enorme).
              const ratio = Math.min(2, Math.max(0.5, w.width / w.height));

              return (
                <li
                  key={w.id}
                  className="fade-up relative overflow-hidden rounded-2xl border bg-card"
                  style={{ "--i": Math.min(index, 10) } as CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(w.id)}
                    className="group relative block w-full text-left"
                  >
                    <div className="overflow-hidden" style={{ aspectRatio: String(ratio) }}>
                      <img
                        src={getWallpaperUrls(w.id).thumb}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      />
                    </div>
                    <span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold backdrop-blur">
                      {qualityLabel(w.quality)}
                    </span>
                    <div className="flex items-center gap-2 p-3">
                      <TeamStripe teamId={w.team_id} teamName={w.team_name} className="h-8" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {[w.driver_name ? w.team_name : null, w.year].filter(Boolean).join(" · ")}
                        </p>
                        {uploader && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              {uploader.avatar_url && <AvatarImage src={uploader.avatar_url} alt="" />}
                              <AvatarFallback className="bg-secondary text-[8px] font-bold">
                                {getInitials(uploaderName(uploader))}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{uploaderName(uploader)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                  <LikeButton
                    active={likedIds.has(w.id)}
                    count={w.likes_count}
                    onToggle={() => (isGuest ? navigate({ to: "/login" }) : toggleLike(w.id))}
                    label={name}
                    className="absolute right-2 top-2 bg-background/80 backdrop-blur"
                  />
                </li>
              );
            })}
          </ul>
          <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />
        </>
      )}

      {selected && (
        <WallpaperModal
          wallpaper={selected}
          isAdmin={isAdmin}
          canDownload={!isGuest}
          uploader={selected.uploaded_by ? (uploaders.get(selected.uploaded_by) ?? null) : null}
          onClose={() => setSelectedId(null)}
          onUpdated={reloadAll}
          onDeleted={() => {
            setSelectedId(null);
            reloadAll();
          }}
        />
      )}
    </>
  );
}
