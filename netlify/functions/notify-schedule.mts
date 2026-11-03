import { runAll } from "../shared/run";

export default async () => {
  try {
    const result = await runAll({ forceSync: false });
    console.log("PitWall (tareas y avisos):", JSON.stringify(result));
  } catch (error) {
    console.error("Error en la tanda de notificaciones:", error);
  }
};

// Cada 1 minuto (horario UTC).
export const config = { schedule: "*/1 * * * *" };