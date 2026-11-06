import webpush from "web-push";
import { adminClient, requireEnv } from "./admin";

interface OutboxRow {
  id: number;
  user_id: string;
  type: string;
  payload: Record<string, unknown> | null;
  attempts: number;
}

interface Subscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface Message {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export interface DeliveryResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  expiredSubscriptions: number;
}

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 5;
const CONCURRENCY = 8;
const KEEP_DAYS = 30;

// Solo se envían avisos a los servicios de notificaciones reales (misma regla que en la base de datos).
const ALLOWED_ENDPOINT =
  /^https:\/\/(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)\//;

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function describeResult(positionText: string, position: number): string {
  if (/^\d+$/.test(positionText)) return `terminó ${positionText}.º`;
  if (positionText === "R") return "abandonó";
  if (positionText === "D") return "fue descalificado";
  if (positionText === "W") return "no largó";
  return Number.isFinite(position) && position > 0 ? `terminó ${position}.º` : "no fue clasificado";
}

function buildMessage(type: string, rows: OutboxRow[]): Message | null {
  const first = rows[0];
  if (!first) return null;
  const payload = first.payload ?? {};

  switch (type) {
    case "friend_request":
      return {
        title: "Nuevo pedido de amistad",
        body: `${text(payload["from_name"], "Alguien")} quiere ser tu amigo en PitWall.`,
        url: "/amigos",
        tag: `friend-${first.id}`,
      };

    case "new_wallpaper": {
      const driver = text(payload["driver_name"], "tu piloto favorito");
      return {
        title: `Fondos nuevos de ${driver}`,
        body: rows.length === 1 ? `Hay un fondo nuevo de ${driver}.` : `Hay ${rows.length} fondos nuevos de ${driver}.`,
        url: "/fondos",
        tag: `wallpaper-${text(payload["driver_id"], "piloto")}`,
      };
    }

    case "points_scored": {
      const points = typeof payload["points"] === "number" ? payload["points"] : 0;
      return {
        title: "Se calcularon tus puntos",
        body: `Sumaste ${points} ${points === 1 ? "punto" : "puntos"} en ${text(payload["race"], "la carrera")}.`,
        url: "/predicciones",
        tag: `points-${first.id}`,
      };
    }

    case "driver_result": {
      const race = text(payload["race"], "la carrera");
      const lines = rows.map((row) => {
        const data = row.payload ?? {};
        return `${text(data["driver_name"], "Tu piloto")} ${describeResult(text(data["position_text"], ""), Number(data["position"]))}`;
      });
      const round = Number(payload["round"]);

      return {
        title: rows.length === 1 ? "Resultado de tu piloto favorito" : "Resultados de tus pilotos favoritos",
        body: rows.length === 1 ? `${lines[0]} en ${race}.` : `${race}: ${lines.join("; ")}.`,
        url: Number.isInteger(round) && round > 0 ? `/gp/${round}` : "/calendario",
        tag: `driver-${String(payload["season"])}-${String(payload["round"])}`,
      };
    }

    case "prediction_reminder": {
      const closesAt = new Date(text(payload["closes_at"], "")).getTime();
      const minutes = Math.round((closesAt - Date.now()) / 60000);
      if (!Number.isFinite(minutes) || minutes <= 0) return null; // ya cerraron

      const when = minutes >= 60 ? "en 1 hora" : `en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
      return {
        title: "Cierran las predicciones",
        body: `Las predicciones de ${text(payload["race"], "la carrera")} cierran ${when}. ¡Hacé la tuya!`,
        url: "/predicciones",
        tag: `reminder-${String(payload["season"])}-${String(payload["round"])}`,
      };
    }

    case "daily_game": {
      const streak = typeof payload["streak"] === "number" ? payload["streak"] : 0;
      return {
        title: "Ya está el circuito de hoy",
        body:
          streak > 0
            ? `Tu racha de ${streak} ${streak === 1 ? "día" : "días"} está en juego. ¿Lo reconocés por su trazado?`
            : "Un circuito nuevo te espera. ¿Lo reconocés por su trazado?",
        url: "/juego",
        tag: `daily-game-${text(payload["date"], "hoy")}`,
      };
    }

    case "test":
      return {
        title: "Notificación de prueba",
        body: "Si ves esto, las notificaciones de PitWall funcionan.",
        url: "/ajustes",
        tag: "test",
      };

    default:
      return null;
  }
}

export async function deliverPending(): Promise<DeliveryResult> {
  const supabase = adminClient();

  webpush.setVapidDetails(requireEnv("VAPID_SUBJECT"), requireEnv("VAPID_PUBLIC_KEY"), requireEnv("VAPID_PRIVATE_KEY"));

  const result: DeliveryResult = { processed: 0, sent: 0, skipped: 0, failed: 0, expiredSubscriptions: 0 };

  // Limpieza: borra avisos ya enviados hace más de KEEP_DAYS días.
  const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("notification_outbox").delete().lt("created_at", cutoff).not("sent_at", "is", null);

  const { data: pending, error } = await supabase
    .from("notification_outbox")
    .select("id, user_id, type, payload, attempts")
    .is("sent_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw new Error(`No se pudo leer la cola de avisos: ${error.message}`);

  const rows = (pending ?? []) as OutboxRow[];
  if (rows.length === 0) return result;

  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const [prefsResult, subsResult] = await Promise.all([
    supabase.from("notification_preferences").select("*").in("user_id", userIds),
    supabase.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth_key").in("user_id", userIds),
  ]);

  if (prefsResult.error) throw new Error(`No se pudieron leer las preferencias: ${prefsResult.error.message}`);
  if (subsResult.error) throw new Error(`No se pudieron leer los dispositivos: ${subsResult.error.message}`);

  const prefs = new Map<string, Record<string, unknown>>();
  for (const row of prefsResult.data ?? []) prefs.set(row.user_id as string, row);

  const subscriptions = new Map<string, Subscription[]>();
  for (const sub of (subsResult.data ?? []) as Subscription[]) {
    subscriptions.set(sub.user_id, [...(subscriptions.get(sub.user_id) ?? []), sub]);
  }

  // Se juntan en un solo aviso: los fondos nuevos del mismo piloto y los resultados de una misma carrera.
  // El resto va de a uno.
  const groups = new Map<string, OutboxRow[]>();
  for (const row of rows) {
    const data = row.payload ?? {};
    let key = `row|${row.id}`;
    if (row.type === "new_wallpaper") {
      key = `${row.user_id}|${row.type}|${String(data["driver_id"] ?? "")}`;
    } else if (row.type === "driver_result") {
      key = `${row.user_id}|${row.type}|${String(data["season"] ?? "")}|${String(data["round"] ?? "")}`;
    }
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  result.processed = rows.length;
  const expired = new Set<string>();

  async function finish(ids: number[], delivery: "sent" | "skipped" | "failed") {
    await supabase
      .from("notification_outbox")
      .update({ sent_at: new Date().toISOString(), delivery })
      .in("id", ids);
  }

  async function processGroup(group: OutboxRow[]) {
    const first = group[0];
    if (!first) return;

    const ids = group.map((row) => row.id);
    const message = buildMessage(first.type, group);
    const wanted = first.type === "test" || prefs.get(first.user_id)?.[first.type] !== false;
    const devices = subscriptions.get(first.user_id) ?? [];

    // Sin mensaje, sin permiso de la persona o sin dispositivos: no hay nada que enviar.
    if (!message || !wanted || devices.length === 0) {
      await finish(ids, "skipped");
      result.skipped += ids.length;
      return;
    }

    const body = JSON.stringify(message);
    let delivered = 0;
    let transient = 0;

    for (const device of devices) {
      if (!ALLOWED_ENDPOINT.test(device.endpoint)) {
        expired.add(device.id);
        continue;
      }

      try {
        await webpush.sendNotification(
          { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth_key } },
          body,
          { TTL: 12 * 60 * 60 },
        );
        delivered += 1;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expired.add(device.id); // el dispositivo ya no existe
        } else {
          transient += 1;
          console.error(`Falló el envío (estado ${status ?? "desconocido"}) para el usuario ${first.user_id}`);
        }
      }
    }

    if (delivered > 0) {
      await finish(ids, "sent");
      result.sent += ids.length;
      return;
    }

    if (transient === 0) {
      await finish(ids, "skipped"); // todos los dispositivos habían caducado
      result.skipped += ids.length;
      return;
    }

    // Falla temporal: se reintenta en la próxima corrida, hasta MAX_ATTEMPTS veces.
    const exhausted = group.filter((row) => row.attempts + 1 >= MAX_ATTEMPTS).map((row) => row.id);
    if (exhausted.length > 0) {
      await finish(exhausted, "failed");
      result.failed += exhausted.length;
    }

    for (const row of group) {
      if (!exhausted.includes(row.id)) {
        await supabase
          .from("notification_outbox")
          .update({ attempts: row.attempts + 1 })
          .eq("id", row.id);
      }
    }
  }

  const entries = [...groups.values()];
  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    await Promise.all(entries.slice(i, i + CONCURRENCY).map(processGroup));
  }

  if (expired.size > 0) {
    await supabase.from("push_subscriptions").delete().in("id", [...expired]);
    result.expiredSubscriptions = expired.size;
  }

  return result;
}