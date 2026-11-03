import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  active: boolean;
  count: number;
  onToggle: () => void;
  label: string;
  className?: string;
}

export function LikeButton({ active, count, onToggle, label, className }: LikeButtonProps) {
  const [popping, setPopping] = useState(false);
  const wasActive = useRef(active);

  // La animación solo se dispara cuando pasa de "sin like" a "con like".
  useEffect(() => {
    if (active && !wasActive.current) {
      setPopping(true);
      const timer = setTimeout(() => setPopping(false), 500);
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
      aria-label={active ? `Quitar like de ${label}` : `Dar like a ${label}`}
      className={cn(
        "group/like inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums text-muted-foreground transition-colors hover:text-primary active:scale-95",
        active && "text-primary",
        className,
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {popping && (
          <span aria-hidden className="animate-like-burst absolute inset-0 rounded-full bg-primary/30" />
        )}
        <Heart
          className={cn(
            "relative h-5 w-5 transition-transform group-hover/like:scale-110",
            active && "fill-primary text-primary",
            popping && "animate-like-pop",
          )}
        />
      </span>
      <span>{count}</span>
    </button>
  );
}
