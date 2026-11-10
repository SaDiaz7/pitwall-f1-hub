import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ImagePlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PasswordInput } from "@/components/PasswordInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BIO_MAX, getInitials, useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";
import { InstallPanel } from "@/components/InstallPanel";
import { NewsEditor } from "@/components/NewsEditor";
import { useIsAdmin } from "@/hooks/useIsAdmin";

import { PredictionsAdmin } from "@/components/PredictionsAdmin";
import { PrivacyPanel } from "@/components/PrivacyPanel";

import { NotificationsPanel } from "@/components/NotificationsPanel";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type Status = { type: "ok" | "error"; text: string } | null;

function Panel({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-5 rounded-2xl border bg-card p-5 md:p-6">{children}</div>;
}

function StatusMessage({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p
      className={cn(
        "rounded-md p-2 text-sm",
        status.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      {status.text}
    </p>
  );
}

function ProfilePanel() {
  const { session } = useSession();
  const { profile, loading, save, uploadAvatar, uploadHeader, removeHeader } = useProfile();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [headerBusy, setHeaderBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const headerInput = useRef<HTMLInputElement>(null);

  // Cuando llegan los datos guardados, los carga en el formulario.
  useEffect(() => {
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
  }, [profile.username, profile.display_name, profile.bio]);

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
      bio: bio.trim() || null,
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

  const onHeaderChange = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;

    setStatus(null);
    setHeaderBusy(true);
    const result = await uploadHeader(file);
    setHeaderBusy(false);

    if (headerInput.current) headerInput.current.value = "";

    setStatus(result.ok ? { type: "ok", text: "Header actualizado." } : { type: "error", text: result.message });
  };

  const onHeaderRemove = async () => {
    setStatus(null);
    setHeaderBusy(true);
    const result = await removeHeader();
    setHeaderBusy(false);

    setStatus(result.ok ? { type: "ok", text: "Header quitado." } : { type: "error", text: result.message });
  };

  if (loading) {
    return (
      <Panel>
        <div className="skeleton h-32 w-full sm:h-44" />
        <div className="skeleton h-16 w-full" />
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="space-y-3">
        <div className="fade-up relative h-32 overflow-hidden rounded-2xl border bg-hero sm:h-44">
          {profile.header_url && (
            <img src={profile.header_url} alt="Tu header" className="h-full w-full object-cover" />
          )}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 racing-stripe opacity-60" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={headerInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onHeaderChange}
          />
          <Button
            type="button"
            variant="outline"
            disabled={headerBusy}
            onClick={() => headerInput.current?.click()}
            className="transition-transform active:scale-95"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            {headerBusy ? "Procesando…" : profile.header_url ? "Cambiar header" : "Subir header"}
          </Button>
          {profile.header_url && (
            <Button
              type="button"
              variant="ghost"
              disabled={headerBusy}
              onClick={onHeaderRemove}
              className="transition-transform active:scale-95"
            >
              Quitar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Ideal: 1500 × 500 px.</p>
        </div>
      </div>

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
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="transition-transform active:scale-95"
          >
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
        <div className="space-y-1.5">
          <Label htmlFor="bio">Biografía</Label>
          <Textarea
            id="bio"
            rows={3}
            value={bio}
            maxLength={BIO_MAX}
            placeholder="Contá algo sobre vos: tu equipo, tu piloto, cómo arrancaste con la F1…"
            onChange={(e) => setBio(e.target.value)}
          />
          <p className="text-right text-xs tabular-nums text-muted-foreground">
            {bio.length}/{BIO_MAX}
          </p>
        </div>

        <StatusMessage status={status} />

        <Button type="submit" disabled={saving} className="bg-gradient-primary font-semibold transition-transform active:scale-95">
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>
    </Panel>
  );
}

function AccountPanel() {
  const { session } = useSession();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const onChangePassword = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);

    if (password.length < 8) {
      setStatus({ type: "error", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      console.error("Cambiar contraseña:", error);
      setStatus({ type: "error", text: translateAuthError(error.message) });
      return;
    }

    setPassword("");
    setConfirm("");
    setStatus({ type: "ok", text: "Contraseña actualizada." });
  };

  const onSignOutEverywhere = async () => {
    if (!window.confirm("¿Cerrar sesión en todos tus dispositivos?")) return;

    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOut(false);

    if (error) {
      console.error("Cerrar sesiones:", error);
      setStatus({ type: "error", text: "No pudimos cerrar las sesiones. Probá de nuevo." });
      return;
    }

    await navigate({ to: "/login" });
  };

  return (
    <div className="space-y-4">
      <Panel>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">Email</p>
          <p className="text-sm text-muted-foreground">{session?.user.email}</p>
        </div>

        <form onSubmit={onChangePassword} noValidate className="space-y-4">
          <h2 className="text-xl font-bold uppercase">Cambiar contraseña</h2>
          <div className="space-y-1.5">
            <Label htmlFor="account-password">Contraseña nueva</Label>
            <PasswordInput
              id="account-password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-confirm">Repetir contraseña</Label>
            <PasswordInput id="account-confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          </div>

          <StatusMessage status={status} />

          <Button type="submit" disabled={saving} className="bg-gradient-primary font-semibold">
            {saving ? "Guardando…" : "Cambiar contraseña"}
          </Button>
        </form>
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold uppercase">Sesiones</h2>
        <p className="text-sm text-muted-foreground">
          Si entraste desde un dispositivo que ya no usás, podés cerrar la sesión en todos a la vez.
        </p>
        <Button type="button" variant="outline" disabled={signingOut} onClick={onSignOutEverywhere}>
          {signingOut ? "Cerrando…" : "Cerrar sesión en todos los dispositivos"}
        </Button>
      </Panel>

      <p className="text-xs text-muted-foreground">
        Más información en los{" "}
        <Link to="/terminos" className="font-semibold text-primary hover:underline">
          términos
        </Link>{" "}
        y la{" "}
        <Link to="/privacidad" className="font-semibold text-primary hover:underline">
          política de privacidad
        </Link>
        .
      </p>
    </div>
  );
}

export function SettingsPage() {
  const isAdmin = useIsAdmin();

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Configurá tu cuenta." />
      <Tabs defaultValue="perfil">
        <TabsList className="mb-4 max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="cuenta">Cuenta</TabsTrigger>
          <TabsTrigger value="privacidad">Privacidad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="app">App</TabsTrigger>
          {isAdmin && <TabsTrigger value="novedades">Novedades</TabsTrigger>}
          {isAdmin && <TabsTrigger value="predicciones">Predicciones</TabsTrigger>}
        </TabsList>

        <TabsContent value="perfil">
          <ProfilePanel />
        </TabsContent>
        <TabsContent value="cuenta">
          <AccountPanel />
        </TabsContent>
        <TabsContent value="privacidad">
          <PrivacyPanel />
        </TabsContent>
        <TabsContent value="notificaciones">
          <NotificationsPanel />
        </TabsContent>
        <TabsContent value="app">
          <InstallPanel />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="novedades">
            <NewsEditor />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="predicciones">
            <PredictionsAdmin />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

