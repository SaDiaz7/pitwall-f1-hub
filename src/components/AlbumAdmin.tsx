import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getDriverStandings } from "@/lib/f1";
import { buildCatalogCards } from "@/lib/album";
import { cn } from "@/lib/utils";

type Status = { type: "ok" | "error"; text: string } | null;

export function AlbumAdmin() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const onSync = async () => {
    setBusy(true);
    setStatus(null);

    try {
      const drivers = await getDriverStandings();
      if (drivers.length === 0) {
        setStatus({ type: "error", text: "No pudimos obtener el campeonato actual. Probá de nuevo en un rato." });
        return;
      }

      const season = new Date().getFullYear();
      const cards = buildCatalogCards(drivers, season);

      const { data, error } = await supabase.rpc("album_sync_cards", { p_cards: cards as unknown as Json });
      if (error) {
        console.error("Sincronizar cartas:", error);
        setStatus({ type: "error", text: "No pudimos guardar las cartas. Revisá la consola para ver el detalle." });
        return;
      }

      setStatus({
        type: "ok",
        text: `Listo: ${data} cartas sincronizadas (${drivers.length} pilotos y ${cards.length - drivers.length} escuderías).`,
      });
    } catch (error) {
      console.error("Sincronizar cartas:", error);
      setStatus({ type: "error", text: "Algo falló al sincronizar. Revisá la consola para ver el detalle." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <div>
        <h2 className="text-xl font-bold uppercase">Álbum de cartas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carga o actualiza las cartas de pilotos y escuderías con el campeonato actual (puntos, victorias y rarezas).
          Las cartas de circuitos salen solas de la tabla del juego diario.
        </p>
      </div>

      {status && (
        <p
          className={cn(
            "rounded-md p-2 text-sm",
            status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {status.text}
        </p>
      )}

      <Button
        type="button"
        onClick={onSync}
        disabled={busy}
        className="bg-gradient-primary font-semibold transition-transform active:scale-95"
      >
        {busy ? "Sincronizando…" : "Sincronizar cartas"}
      </Button>
    </div>
  );
}