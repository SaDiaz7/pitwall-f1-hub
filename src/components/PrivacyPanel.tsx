import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useProfile } from "@/hooks/useProfile";

export function PrivacyPanel() {
  const { profile, loading, save } = useProfile();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const onChange = async (checked: boolean) => {
    setMessage(null);
    setSaving(true);
    const result = await save({ is_public: checked });
    setSaving(false);
    setMessage(
      result.ok
        ? { type: "ok", text: checked ? "Ahora aparecés en el ranking." : "Ya no aparecés en el ranking." }
        : { type: "error", text: result.message },
    );
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <label htmlFor="is-public" className="font-semibold">
            Aparecer en el ranking y en las búsquedas
          </label>
          <p className="text-sm text-muted-foreground">
            Otros usuarios podrán ver tu nombre de usuario, tu nombre visible, tu avatar y tus puntos. Tu email nunca
            se muestra.
          </p>
        </div>
        <Switch id="is-public" checked={profile.is_public} disabled={saving} onCheckedChange={onChange} />
      </div>

      {!profile.username && (
        <p className="text-xs text-muted-foreground">
          Para aparecer también necesitás un nombre de usuario (Ajustes → Perfil).
        </p>
      )}

      {message && (
        <p
          className={
            message.type === "ok"
              ? "rounded-md bg-success/15 p-2 text-sm text-success"
              : "rounded-md bg-destructive/15 p-2 text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}