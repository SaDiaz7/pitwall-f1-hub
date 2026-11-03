import { deliverPending } from "./deliver";
import { runRaceTasks } from "./race-tasks";

export async function runAll(options: { forceSync: boolean }) {
  const tasks = await runRaceTasks(options);
  const delivery = await deliverPending();
  return { tasks, delivery };
}