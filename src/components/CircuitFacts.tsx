import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCircuitFacts } from "@/hooks/useCircuitFacts";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type Status = { type: "ok" | "error"; text: string } | null;

export function CircuitFacts({ circuitId, circuitName }: { circuitId: string; circuitName: string }) {
  const isAdmin = useIsAdmin();
  const { facts, loading, add, remove } = useCircuitFacts(circuitId);

  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  // Cuando llegan los datos, arranca con uno al azar.
  useEffect(() => {
    if (facts.length > 0) setIndex(Math.floor(Math.random() * facts.length));
  }, [facts.length]);

  const current = facts[index] ?? facts[0];

  const showAnother = () => {
    if (facts.length < 2) return;
    let next = index;
    while (next === index) next = Math.floor(Math.random() * facts.length);
    setIndex(next);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);

    if (text.trim().length < 10) {
      setStatus({ type: "error", text: "El dato tiene que tener al menos 10 caracteres." });
      return;
    }

    setSaving(true);
    const result = await add(text, source);
    setSaving(false);

    if (result.ok) {
      setText("");
      setSource("");
      setStatus({ type: "ok", text: "Dato agregado." });
    } else {
      setStatus({ type: "error", text: result.message });
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("¿Borrar este dato?")) return;
    const result = await remove(id);
    if (!result.ok) setStatus({ type: "error", text: result.message });
  };

  if (loading) return null;
  // Los usuarios comunes no ven la tarjeta si todavía no hay datos.
  if (!isAdmin && facts.length === 0) return null;

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">¿Sabías que…?</p>

      {current ? (
        <div className="space-y-2">
          <p className="text-base leading-relaxed">{current.fact}</p>
          {current.source && <p className="text-xs text-muted-foreground">Fuente: {current.source}</p>}
          {facts.length > 1 && (
            <button type="button" onClick={showAnother} className="text-sm font-semibold text-primary hover:underline">
              Otro dato
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay datos curiosos de este circuito.</p>
      )}

      {isAdmin && (
        <div className="space-y-4 border-t pt-4">
          <form onSubmit={onSubmit} noValidate className="space-y-3">
            <p className="text-sm font-semibold">Agregar dato de {circuitName}</p>
            <div className="space-y-1.5">
              <Label htmlFor="fact-text">Dato (10 a 400 caracteres)</Label>
              <textarea
                id="fact-text"
                value={text}
                maxLength={400}
                rows={3}
                onChange={(e) => setText(e.target.value)}
                placeholder="ej. Este circuito se inauguró en… y fue sede de…"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fact-source">Fuente (opcional)</Label>
              <Input id="fact-source" value={source} maxLength={120} onChange={(e) => setSource(e.target.value)} />
            </div>

            {status && (
              <p
                className={
                  status.type === "ok"
                    ? "rounded-md bg-success/15 p-2 text-sm text-success"
                    : "rounded-md bg-destructive/15 p-2 text-sm text-destructive"
                }
              >
                {status.text}
              </p>
            )}

            <Button type="submit" disabled={saving} className="bg-gradient-primary font-semibold">
              {saving ? "Guardando…" : "Agregar dato"}
            </Button>
          </form>

          {facts.length > 0 && (
            <ul className="space-y-2">
              {facts.map((fact) => (
                <li key={fact.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{fact.fact}</span>
                  <button
                    type="button"
                    onClick={() => onDelete(fact.id)}
                    aria-label="Borrar dato"
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}