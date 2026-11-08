import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNotificationPrefs, type PrefKey } from "@/hooks/useNotificationPrefs";
import { usePush } from "@/hooks/usePush";
import { supabase } from "@/integrations/supabase/client";

interface Option {
  key: PrefKey;
  title: string;
  text: string;
  soon?: boolean;
}

const OPTIONS: Option[] = [
  { key: "friend_request", title: "Pedidos de amistad", text: "Cuando alguien te agrega como amigo." },
  { key: "new_wallpaper", title: "Fondos nuevos", text: "Cuando se suben fondos de tus pilotos favoritos." },
  { key: "points_scored", title: "Puntos de la carrera", text: "Cuando se calculan tus puntos de predicciones." },
  {
    key: "driver_result",
    title: "Resultado de tu piloto favorito",
    text: "En qué posición terminó tu piloto favorito.",
  },
  {
    key: "prediction_reminder",
    title: "Recordatorio de predicciones",
    text: "Un aviso antes de que cierren las predicciones.",
  },
  {
    key: "daily_game",
    title: "Juego diario",
    text: "Un aviso al mediodía si todavía no jugaste el circuito del día.",
  },
  {
    key: "dotd_open",
    title: "Piloto del día",
    text: "Un aviso cuando se abre la votación, en las últimas vueltas de cada carrera.",
  },
];

type Message = { type: "ok" | "error"; text: string } | null;

export function NotificationsPanel() {
  const { support, permission, subscribed, busy, enable, disable } = usePush();
  const { prefs, loading, update } = useNotificationPrefs();
  const [message, setMessage] = useState<Message>(null);
  const [testing, setTesting] = useState(false);

  const onToggleDevice = async () => {
    setMessage(null);
    const result = subscribed ? await disable() : await enable();
    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }
    setMessage({
      type: "ok",
      text: subscribed ? "Desactivaste las notificaciones en este dispositivo." : "Notificaciones activadas en este dispositivo.",
    });
  };

  const onTest = async () => {
    setMessage(null);
    setTesting(true);
    const { error } = await supabase.rpc("send_test_notification");
    setTesting(false);

    if (error) {
      console.error("Enviar prueba:", error);
      setMessage({ type: "error", text: "No pudimos programar la prueba." });
      return;
    }
    setMessage({
      type: "ok",
      text: "Listo: la notificación de prueba llega en unos segundos (los avisos se envían cada 1 minuto).",
    });
  };

  const onToggleOption = async (key: PrefKey, value: boolean) => {
    setMessage(null);
    const ok = await update(key, value);
    if (!ok) setMessage({ type: "error", text: "No pudimos guardar el cambio." });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">Este dispositivo</h2>

        {support === "needs-install" && (
          <p className="text-sm text-muted-foreground">
            En iPhone, las notificaciones solo funcionan con PitWall instalada. Andá a la pestaña{" "}
            <span className="font-semibold">App</span>, seguí los pasos para agregarla a tu pantalla de inicio, abrila
            desde ahí y volvé a esta pantalla.
          </p>
        )}

        {support === "unsupported" && (
          <p className="text-sm text-muted-foreground">
            Este navegador no admite notificaciones. Probá con Chrome en Android o con la app instalada en iPhone.
          </p>
        )}

        {support === "supported" && (
          <>
            <p className="text-sm text-muted-foreground">
              {subscribed
                ? "Las notificaciones están activadas en este dispositivo."
                : "Activalas para recibir avisos de PitWall aunque la app esté cerrada."}
            </p>

            {permission === "denied" && !subscribed && (
              <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">
                Las notificaciones están bloqueadas para este sitio. Habilitalas desde los permisos del navegador y
                volvé a intentarlo.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={busy}
                onClick={onToggleDevice}
                variant={subscribed ? "outline" : "default"}
                className={subscribed ? "" : "bg-gradient-primary font-semibold"}
              >
                {busy ? "Procesando…" : subscribed ? "Desactivar en este dispositivo" : "Activar notificaciones"}
              </Button>

              {subscribed && (
                <Button type="button" variant="outline" disabled={testing} onClick={onTest}>
                  {testing ? "Programando…" : "Enviar prueba"}
                </Button>
              )}
            </div>
          </>
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

      <div className="space-y-5 rounded-2xl border bg-card p-5 md:p-6">
        <h2 className="text-xl font-bold uppercase">Qué avisos querés recibir</h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : (
          OPTIONS.map((option) => (
            <div key={option.key} className="flex items-center justify-between gap-4">
              <div>
                <label htmlFor={`pref-${option.key}`} className="font-semibold">
                  {option.title}
                  {option.soon && (
                    <span className="ml-2 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Próximamente
                    </span>
                  )}
                </label>
                <p className="text-sm text-muted-foreground">{option.text}</p>
              </div>
              <Switch
                id={`pref-${option.key}`}
                checked={prefs[option.key]}
                disabled={option.soon}
                onCheckedChange={(checked) => onToggleOption(option.key, checked)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}