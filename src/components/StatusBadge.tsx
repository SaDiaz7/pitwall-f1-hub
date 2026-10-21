import type { GrandPrixStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: GrandPrixStatus }) {
  const done = status === "finalizado";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        done ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", done ? "bg-muted-foreground" : "bg-primary")}
      />
      {done ? "Finalizado" : "Próximo"}
    </span>
  );
}
