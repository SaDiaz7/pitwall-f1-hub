import { timingSafeEqual } from "node:crypto";
import { runAll } from "../shared/run";

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && timingSafeEqual(first, second);
}

export default async (req: Request) => {
  const secret = process.env["CRON_SECRET"];
  const provided = req.headers.get("x-cron-secret");

  if (!secret || !provided || !safeEqual(provided, secret)) {
    return new Response("No autorizado", { status: 401 });
  }

  // Con ?sync=1 se fuerza la sincronización del calendario.
  const forceSync = new URL(req.url).searchParams.get("sync") === "1";

  try {
    const result = await runAll({ forceSync });
    return Response.json(result);
  } catch (error) {
    console.error("Error en la tanda de notificaciones:", error);
    return new Response("Error en la tanda de notificaciones", { status: 500 });
  }
};