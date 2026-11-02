import { timingSafeEqual } from "node:crypto";
import { deliverPending } from "../shared/deliver";

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

  try {
    const result = await deliverPending();
    return Response.json(result);
  } catch (error) {
    console.error("Error al enviar notificaciones:", error);
    return new Response("Error al enviar notificaciones", { status: 500 });
  }
};