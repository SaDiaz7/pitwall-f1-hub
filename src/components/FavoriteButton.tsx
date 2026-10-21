import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  label: string;
}

export function FavoriteButton({ active, onToggle, label }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Quitar ${label} de favoritos` : `Agregar ${label} a favoritos`}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-primary"
    >
      <Star className={cn("h-5 w-5", active && "fill-primary text-primary")} />
    </button>
  );
}