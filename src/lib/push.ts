import { supabase } from "@/integrations/supabase/client";
import { isIos, isStandalone } from "@/lib/install-prompt";
import { VAPID_PUBLIC_KEY } from "@/lib/push-config";

export type PushSupport = "supported" | "unsupported" | "needs-install";
export type PushResult = { ok: true } | { ok: false; message: string };

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";

  // En iPhone solo funciona con la app instalada.
  if (isIos() && !isStandalone()) return "needs-install";

  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  return supported ? "supported" : "unsupported";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function enablePush(): Promise<PushResult> {
  if (getPushSupport() !== "supported") {
    return { ok: false, message: "Este dispositivo o navegador no admite notificaciones." };
  }
  if (VAPID_PUBLIC_KEY.startsWith("PEGA-ACA")) {
    return { ok: false, message: "Falta configurar la clave pública de notificaciones en el código." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      message:
        permission === "denied"
          ? "Bloqueaste las notificaciones para este sitio. Habilitalas desde los permisos del navegador."
          : "No diste permiso para recibir notificaciones.",
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return { ok: false, message: "Las notificaciones solo funcionan en la versión publicada del sitio." };
  }

  try {
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const json = subscription.toJSON();
    const p256dh = json.keys?.["p256dh"];
    const authKey = json.keys?.["auth"];
    if (!json.endpoint || !p256dh || !authKey) {
      return { ok: false, message: "No pudimos obtener los datos de la suscripción." };
    }

    const { error } = await supabase.rpc("save_push_subscription", {
      p_endpoint: json.endpoint,
      p_p256dh: p256dh,
      p_auth_key: authKey,
      p_user_agent: navigator.userAgent,
    });

    if (error) {
      console.error("Guardar suscripción:", error);
      return { ok: false, message: "No pudimos guardar este dispositivo. Probá de nuevo." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Activar notificaciones:", error);
    return { ok: false, message: "No pudimos activar las notificaciones en este dispositivo." };
  }
}

export async function disablePush(): Promise<PushResult> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return { ok: true };

  const endpoint = subscription.endpoint;

  try {
    await subscription.unsubscribe();
  } catch (error) {
    console.error("Cancelar suscripción del navegador:", error);
  }

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) {
    console.error("Borrar suscripción:", error);
    return { ok: false, message: "No pudimos desactivar este dispositivo del todo. Probá de nuevo." };
  }

  return { ok: true };
}