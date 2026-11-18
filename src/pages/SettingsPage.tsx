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
import { AlbumAdmin } from "@/components/AlbumAdmin";
import { AdminUsers } from "@/components/AdminUsers";
import { AdminActivity } from "@/components/AdminActivity";
import { AdminSchedule } from "@/components/AdminSchedule";
import { AdminAlbumEconomy } from "@/components/AdminAlbumEconomy";
import { AdminWalls } from "@/components/AdminWalls";
import { CountryFlag } from "@/components/CountryFlag";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { PredictionsAdmin } from "@/components/PredictionsAdmin";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { AlbumShowcase } from "@/components/AlbumShowcase";
import { ProfileHeader } from "@/components/ProfileHeader";

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
  const { profile, loading } = useProfile();
  const userId = session?.user.id;

  if (loading || !userId) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="skeleton h-32 w-full sm:h-44" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Así se ve tu perfil para los demás. Cambiá tu header, tu avatar y tus datos desde acá, y elegí las cartas que
        querés mostrar primero.
      </p>

      <ProfileHeader profile={profile} isSelf alwaysEditing />

      <AlbumShowcase userId={userId} isSelf />

      <Link
        to="/usuario/$id"
        params={{ id: userId }}
        className="inline-block text-sm font-semibold text-primary hover:underline"
      >
        Ver mi perfil público completo →
      </Link>
    </div>
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
          {isAdmin && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
          {isAdmin && <TabsTrigger value="actividad">Actividad</TabsTrigger>}
          {isAdmin && <TabsTrigger value="muros">Muros</TabsTrigger>}
          {isAdmin && <TabsTrigger value="novedades">Novedades</TabsTrigger>}
          {isAdmin && <TabsTrigger value="predicciones">Predicciones</TabsTrigger>}
          {isAdmin && <TabsTrigger value="album">Álbum</TabsTrigger>}          
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
        {isAdmin && (
          <TabsContent value="album">
            <div className="space-y-6">
              <AlbumAdmin />
              <AdminAlbumEconomy />
            </div>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="usuarios">
            <AdminUsers />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="actividad">
            <div className="space-y-8">
              <AdminSchedule />
              <AdminActivity />
            </div>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="muros">
            <AdminWalls />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

