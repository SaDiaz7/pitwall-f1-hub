import { useEffect, useState } from "react";
import { NewsBody } from "@/components/NewsBody";
import { Button } from "@/components/ui/button";
import { useNews } from "@/hooks/useNews";

export function NewsDialog() {
  const { news, visible, close } = useNews();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    void close(dontShowAgain);
  };

  // Se cierra con la tecla Escape (sin marcar "no mostrar de nuevo").
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  if (!visible || !news) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={news.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border bg-card p-6 shadow-glow">
        <h2 className="font-display text-2xl font-bold uppercase italic">{news.title}</h2>

        <NewsBody text={news.body} />

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          No mostrar de nuevo
        </label>

        <Button type="button" onClick={handleClose} className="h-11 w-full bg-gradient-primary font-semibold uppercase">
          Entendido
        </Button>
      </div>
    </div>
  );
}