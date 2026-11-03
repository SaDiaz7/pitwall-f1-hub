import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  active: boolean;
  onToggle: () => void;
  label: string;
}

export function FavoriteButton({ active, onToggle, label }: FavoriteButtonProps) {
  const [popping, setPopping] = useState(false);
  const wasActive = useRef(active);

  // La animación solo se dispara cuando pasa de "no favorito" a "favorito".
  useEffect(() => {
    if (active && !wasActive.current) {
      setPopping(true);
      const timer = setTimeout(() => setPopping(false), 550);
      wasActive.current = true;
      return () => clearTimeout(timer);
    }
    if (!active) setPopping(false);
    wasActive.current = active;
  }, [active]);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `Quitar ${label} de favoritos` : `Agregar ${label} a favoritos`}
      className="group/star rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-primary active:scale-90"
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {popping && (
          <span aria-hidden className="animate-like-burst absolute inset-0 rounded-full bg-primary/30" />
        )}
        <Star
          className={cn(
            "relative h-5 w-5 transition-transform group-hover/star:scale-110",
            active && "fill-primary text-primary",
            popping && "animate-star-pop",
          )}
        />
      </span>
    </button>
  );
}
