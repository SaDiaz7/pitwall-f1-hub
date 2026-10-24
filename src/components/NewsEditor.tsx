import { useEffect, useState, type FormEvent } from "react";
import { NewsBody } from "@/components/NewsBody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNews } from "@/hooks/useNews";
import { supabase } from "@/integrations/supabase/client";

type Status = { type: "ok" | "error"; text: string } | null;

export function NewsEditor() {
  const { news, loading, reload } = useNews();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);

  // Carga el anuncio actual en el formulario.
  useEffect(() => {
    if (news) {
      setTitle(news.title);
      setBody(news.body);
      setActive(news.active);
    }
  }, [news]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);

    if (!title.trim() || !body.trim()) {
      setStatus({ type: "error", text: "Completá el título y el texto." });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("site_news")
      .upsert({ id: 1, title: title.trim(), body: body.trim(), active }, { onConflict: "id" });
    setSaving(false);

    if (error) {
      console.error("Guardar novedades:", error);
      setStatus({ type: "error", text: "No pudimos guardar las novedades. Revisá la consola para ver el detalle." });
      return;
    }

    await reload();
    setStatus({ type: "ok", text: "Guardado. Si cambiaste el título o el texto, vuelve a aparecerle a todos." });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
        <div>
          <h2 className="text-xl font-bold uppercase">Panel de novedades</h2>
          <p className="text-sm text-muted-foreground">
            Cada vez que cambiás el título o el texto, el panel vuelve a aparecerles a todos los usuarios, incluso a los
            que marcaron “No mostrar de nuevo”.
            {news ? ` Versión actual: ${news.version}.` : ""}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-title">Título</Label>
          <Input id="news-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="news-body">Texto (las líneas que empiezan con “- ” se muestran como lista)</Label>
          <textarea
            id="news-body"
            value={body}
            maxLength={2000}
            rows={10}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Mostrar el panel a los usuarios
        </label>

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
          {saving ? "Guardando…" : "Guardar y avisar a los usuarios"}
        </Button>
      </form>

      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Vista previa</p>
        <h3 className="font-display text-xl font-bold uppercase italic">{title || "…"}</h3>
        <NewsBody text={body} />
      </div>
    </div>
  );
}