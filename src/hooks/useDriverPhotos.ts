import { useEffect, useState } from "react";
import { getDriverPhotos, type DriverPhoto, type DriverPhotos } from "@/lib/f1";

// Lo que ya se pidió queda en memoria mientras la pestaña está abierta.
const clientCache = new Map<string, DriverPhoto | null>();

interface DriverRef {
  id: string;
  wikiUrl?: string | null | undefined;
}

export function useDriverPhotos(drivers: DriverRef[]): DriverPhotos {
  const [photos, setPhotos] = useState<DriverPhotos>({});
  const key = drivers.map((d) => d.id).join(",");

  useEffect(() => {
    let cancelled = false;
    const known: DriverPhotos = {};
    const missing: { id: string; wikiUrl: string | null }[] = [];

    for (const driver of drivers) {
      if (clientCache.has(driver.id)) known[driver.id] = clientCache.get(driver.id) ?? null;
      else missing.push({ id: driver.id, wikiUrl: driver.wikiUrl ?? null });
    }

    setPhotos(known);
    if (missing.length === 0) return;

    getDriverPhotos({ data: { drivers: missing.slice(0, 40) } })
      .then((result) => {
        for (const [id, photo] of Object.entries(result)) clientCache.set(id, photo);
        if (!cancelled) setPhotos((prev) => ({ ...prev, ...result }));
      })
      .catch((error) => console.error("Fotos de pilotos:", error));

    return () => {
      cancelled = true;
    };
    // Se vuelve a pedir solo cuando cambia la lista de pilotos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return photos;
}