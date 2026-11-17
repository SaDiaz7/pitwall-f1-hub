import { useRef, useState } from "react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { Button } from "@/components/ui/button";
import { optimizeWallpaperImages, type Wallpaper } from "@/lib/wallpapers";

export function WallpaperOptimizer({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [done, setDone] = useState(0);
  const [changed, setChanged] = useState(0);
  const [failures, setFailures] = useState<string[]>([]);
  const stopRequested = useRef(false);

  const total = wallpapers.length;

  const run = async () => {
    stopRequested.current = false;
    setRunning(true);
    setFinished(false);
    setDone(0);
    setChanged(0);
    setFailures([]);

    let changedCount = 0;
    const errors: string[] = [];

    for (let index = 0; index < wallpapers.length; index++) {
      if (stopRequested.current) break;
      const wallpaper = wallpapers[index];
      if (!wallpaper) continue;

      const result = await optimizeWallpaperImages(wallpaper.id);
      if (!result.ok) {
        errors.push(`${wallpaper.driver_name ?? wallpaper.team_name ?? wallpaper.id}: ${result.message}`);
      } else if (result.changed) {
        changedCount += 1;
      }

      setDone(index + 1);
      setChanged(changedCount);
      setFailures([...errors]);
    }

    setRunning(false);
    setFinished(true);
  };

  return (
    <section className="fade-up space-y-3 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-bold uppercase">Optimizar imágenes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa cada fondo (mirando solo el tamaño de sus archivos) y vuelve a generar la miniatura y la vista previa
          de los que pesan de más. Para esos baja el original una vez. Dejá esta pestaña abierta mientras trabaja.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {running ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              stopRequested.current = true;
            }}
            className="transition-transform active:scale-95"
          >
            Detener
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void run()}
            disabled={total === 0}
            className="bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            {finished ? "Volver a revisar" : "Empezar"}
          </Button>
        )}
        <span className="text-sm tabular-nums text-muted-foreground">
          {done}/{total} revisados · {changed} optimizados
        </span>
      </div>

      <AnimatedBar percent={total > 0 ? (done / total) * 100 : 0} className="h-2" />

      {finished && failures.length === 0 && (
        <p className="rounded-md bg-success/15 p-2 text-sm text-success">
          Listo: {changed} {changed === 1 ? "fondo optimizado" : "fondos optimizados"}.
        </p>
      )}

      {failures.length > 0 && (
        <ul className="space-y-1 rounded-md bg-destructive/15 p-2 text-xs text-destructive">
          {failures.slice(0, 10).map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
          {failures.length > 10 && <li>…y {failures.length - 10} más (mirá la consola).</li>}
        </ul>
      )}
    </section>
  );
}