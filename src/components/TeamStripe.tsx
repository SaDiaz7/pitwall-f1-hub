import { getTeamColor } from "@/lib/team-colors";
import { cn } from "@/lib/utils";

// Barrita vertical con el color del equipo, como en los tableros de tiempos.
export function TeamStripe({
  teamId,
  teamName,
  className,
}: {
  teamId?: string | null | undefined;
  teamName?: string | null | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block w-1 shrink-0 rounded-sm", className ?? "h-6")}
      style={{ backgroundColor: getTeamColor(teamId, teamName) }}
    />
  );
}