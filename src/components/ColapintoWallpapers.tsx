import { useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { WallpaperModal } from "@/components/WallpaperModal";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSession } from "@/hooks/useSession";
import { useWallpapers } from "@/hooks/useWallpapers";
import { getWallpaperUrls, orientationOf } from "@/lib/wallpapers";
import { cn } from "@/lib/utils";

const MAX = 12;

export function ColapintoWallpapers({ driverId }: { driverId: string }) {
  const { session } = useSession();
  const isAdmin = useIsAdmin();
  const { wallpapers, loading, reload } = useWallpapers();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = wallpapers.filter((w) => w.driver_id === driverId);
  const selected = selectedId ? (mine.find((w) => w.id === selectedId) ?? null) : null;

  if (loading) {
    return (
      <section>
        <div className="skeleton mb-3 h-8 w-56" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="skeleton aspect-[4/3]" />
          ))}
        </ul>
      </section>
    );
  }

  if (mine.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold uppercase">Fondos de Franco</h2>
        <Link to="/fondos" className="text-sm font-semibold text-primary hover:underline">
          Ver todos los fondos
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]">
        {mine.slice(0, MAX).map((w, index) => {
          const landscape = orientationOf(w.width, w.height) === "landscape";
          const thumb = getWallpaperUrls(w.id).thumb;

          return (
            <li key={w.id} className="fade-up" style={{ "--i": Math.min(index, 8) } as CSSProperties}>
              <button
                type="button"
                onClick={() => setSelectedId(w.id)}
                aria-label={`Ver fondo de ${w.driver_name ?? "Franco"} (${w.year})`}
                className="card-link group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-secondary"
              >
                {!landscape && (
                  <img
                    src={thumb}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl"
                  />
                )}
                <img
                  src={thumb}
                  alt=""
                  loading="lazy"
                  className={cn(
                    "relative h-full w-full transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                    landscape ? "object-cover" : "object-contain",
                  )}
                />
                <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-0.5 text-xs font-bold backdrop-blur">
                  {w.year}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <WallpaperModal
          wallpaper={selected}
          isAdmin={isAdmin}
          canDownload={Boolean(session)}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            void reload();
          }}
          onDeleted={() => {
            setSelectedId(null);
            void reload();
          }}
        />
      )}
    </section>
  );
}