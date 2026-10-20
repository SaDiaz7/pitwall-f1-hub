import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <Panel>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16"><AvatarFallback className="bg-gradient-primary font-display text-2xl text-primary-foreground">PW</AvatarFallback></Avatar>
              <div className="space-y-1.5">
                <Label htmlFor="avatar">Avatar</Label>
                <Input id="avatar" type="file" accept="image/*" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input id="username" placeholder="ej. tifosi_44" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Nombre visible</Label>
              <Input id="displayName" placeholder="Tu nombre" />
            </div>
            <Button className="bg-gradient-primary font-semibold">Guardar cambios</Button>
          </Panel>
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
