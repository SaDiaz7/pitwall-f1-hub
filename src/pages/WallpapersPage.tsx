import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { WallpaperModal } from "@/components/WallpaperModal";
import { WallpaperUploadForm } from "@/components/WallpaperUploadForm";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useWallpapers } from "@/hooks/useWallpapers";
import { getWallpaperUrls, qualityLabel, type Wallpaper } from "@/lib/wallpapers";
import { TeamStripe } from "@/components/TeamStripe";
import { LikeButton } from "@/components/LikeButton";
import { Pagination } from "@/components/Pagination";


interface Filters {
  year: string;
  team: string;
  driver: string;
  quality: string;
}

const EMPTY_FILTERS: Filters = { year: "", team: "", driver: "", quality: "" };
const SELECT_CLASS = "h-10 w-full rounded-md border bg-card px-3 text-sm";
type SortOrder = "recent" | "most" | "least";
const PAGE_SIZE = 20; // fondos por página


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
  const { wallpapers, likedIds, loading, error, reload, toggleLike } = useWallpapers();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState<Wallpaper | null>(null);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [page, setPage] = useState(1);
  const gridTopRef = useRef<HTMLParagraphElement>(null);

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
        (!filters.quality || w.quality === filters.quality),
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

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
            {visible.map((w) => {
              const name = w.driver_name ?? w.team_name ?? "Fondo";
              return (
                <li key={w.id} className="relative overflow-hidden rounded-2xl border bg-card">
                  <button
                    type="button"
                    onClick={() => setSelected(w)}
                    className="group relative block w-full text-left"
                  >
                    <img
                      src={getWallpaperUrls(w.id).thumb}
                      alt={name}
                      loading="lazy"
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute left-2 top-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold backdrop-blur">
                      {qualityLabel(w.quality)}
                    </span>
                    <div className="flex items-center gap-2 p-3">
                      <TeamStripe teamId={w.team_id} teamName={w.team_name} className="h-8" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{name}</p>
                        <p ref={gridTopRef} className="mb-3 scroll-mt-4 text-sm text-muted-foreground">
                          {[w.driver_name ? w.team_name : null, w.year].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  </button>
                  <LikeButton
                    active={likedIds.has(w.id)}
                    count={w.likes_count}
                    onToggle={() => toggleLike(w.id)}
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
