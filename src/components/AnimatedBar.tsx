import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Barra de progreso que se llena sola al aparecer.
export function AnimatedBar({
  percent,
  color,
  className,
}: {
  percent: number;
  color?: string | undefined;
  className?: string | undefined;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", !color && "bg-gradient-primary")}
        style={{ width: `${width}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}