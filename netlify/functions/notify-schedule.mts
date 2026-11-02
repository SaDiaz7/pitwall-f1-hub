import { deliverPending } from "../shared/deliver";

export default async () => {
  try {
    const result = await deliverPending();
    console.log("Notificaciones:", JSON.stringify(result));
  } catch (error) {
    console.error("Error al enviar notificaciones:", error);
  }
};

// Cada 5 minutos (horario UTC).
export const config = { schedule: "*/5 * * * *" };