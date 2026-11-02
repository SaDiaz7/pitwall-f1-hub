import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useProfile, type Profile } from "@/hooks/useProfile";

type Message = { type: "ok" | "error"; text: string } | null;

function Row({
  id,
  title,
  text,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  title: string;
  text: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold">
          {title}
        </label>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}

export function PrivacyPanel() {
  const { profile, loading, save } = useProfile();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const update = async (changes: Partial<Profile>, okText: string) => {
    setMessage(null);
    setSaving(true);
    const result = await save(changes);
    setSaving(false);
    setMessage(result.ok ? { type: "ok", text: okText } : { type: "error", text: result.message });
  };

  if (loading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 md:p-6">
      <Row
        id="is-public"
        title="Aparecer en el ranking y en las búsquedas"
        text="Otros usuarios podrán ver tu nombre de usuario, tu nombre visible, tu avatar y tus puntos. Tu email nunca se muestra."
        checked={profile.is_public}
        disabled={saving}
        onChange={(checked) =>
          update(
            { is_public: checked },
            checked ? "Ahora aparecés en el ranking." : "Ya no aparecés en el ranking.",
          )
        }
      />

      <Row
        id="show-favorites"
        title="Mostrar mis favoritos en mi perfil"
        text="Quienes puedan ver tu perfil verán tus pilotos y equipos favoritos."
        checked={profile.show_favorites}
        disabled={saving}
        onChange={(checked) =>
          update(
            { show_favorites: checked },
            checked ? "Tus favoritos ahora se ven en tu perfil." : "Tus favoritos ya no se ven en tu perfil.",
          )
        }
      />

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