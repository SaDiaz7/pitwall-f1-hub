import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Status = { type: "ok" | "error"; text: string } | null;

function Panel({ children }: { children: ReactNode }) {
  return <div className="space-y-5 rounded-2xl border bg-card p-5 md:p-6">{children}</div>;
}

function ToggleRow({ id, title, text, defaultChecked }: { id: string; title: string; text: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="font-semibold">{title}</Label>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
      <Switch id={id} defaultChecked={!!defaultChecked} />
    </div>
  );
}

function ProfilePanel() {
  const { session } = useSession();
  const { profile, loading, save, uploadAvatar } = useProfile();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Cuando llegan los datos guardados, los carga en el formulario.
  useEffect(() => {
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
  }, [profile.username, profile.display_name]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);

    const cleanUsername = username.trim();
    if (cleanUsername && !USERNAME_RE.test(cleanUsername)) {
      setUsernameError("Usá de 3 a 20 caracteres: minúsculas, números o guion bajo.");
      return;
    }
    setUsernameError(null);

    setSaving(true);
    const result = await save({
      username: cleanUsername || null,
      display_name: displayName.trim() || null,
    });
    setSaving(false);

    setStatus(result.ok ? { type: "ok", text: "Cambios guardados." } : { type: "error", text: result.message });
  };

  const onAvatarChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);

    // Limpia el input para poder elegir el mismo archivo otra vez si hace falta.
    if (fileInput.current) fileInput.current.value = "";

    setStatus(result.ok ? { type: "ok", text: "Avatar actualizado." } : { type: "error", text: result.message });
  };

  if (loading) {
    return (
      <Panel>
        <p className="text-sm text-muted-foreground">Cargando tu perfil…</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="Tu avatar" />}
          <AvatarFallback className="bg-gradient-primary font-display text-2xl text-primary-foreground">
            {getInitials(profile.display_name || profile.username || session?.user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onAvatarChange}
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? "Subiendo…" : "Cambiar avatar"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG o WebP, hasta 2 MB.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            placeholder="ej. tifosi_44"
            value={username}
            maxLength={20}
            aria-invalid={!!usernameError}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          {usernameError && <p className="text-sm text-destructive">{usernameError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nombre visible</Label>
          <Input
            id="displayName"
            placeholder="Tu nombre"
            value={displayName}
            maxLength={40}
            onChange={(e) => setDisplayName(e.target.value)}
          />
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
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </Panel>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Ajustes" subtitle="Configurá tu cuenta." />
      <Tabs defaultValue="perfil">
        <TabsList className="mb-4">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="privacidad">Privacidad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil">
          <ProfilePanel />
        </TabsContent>
        <TabsContent value="privacidad">
          <Panel>
            <ToggleRow id="public" title="Perfil público" text="Otros fans pueden ver tu perfil." defaultChecked />
            <ToggleRow id="showEmail" title="Mostrar email" text="Tu email será visible en tu perfil." />
            <ToggleRow id="activity" title="Mostrar actividad" text="Compartí tu actividad reciente." defaultChecked />
          </Panel>
        </TabsContent>
        <TabsContent value="notificaciones">
          <Panel>
            <ToggleRow id="raceReminder" title="Recordatorio de carrera" text="Aviso una hora antes de cada GP." defaultChecked />
            <ToggleRow id="results" title="Resultados" text="Recibí los resultados al terminar la carrera." defaultChecked />
            <ToggleRow id="news" title="Novedades de PitWall" text="Nuevas funciones y anuncios." />
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  );
}