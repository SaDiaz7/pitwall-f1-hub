import { useEffect, useState } from "react";

// La hora actual, que se actualiza sola. Vale null hasta que la página carga en el navegador,
// para que el servidor y el navegador no muestren horas distintas.
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}