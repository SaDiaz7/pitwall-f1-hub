import { useState } from "react";
import { getInitials } from "@/hooks/useProfile";
import type { DriverPhoto } from "@/lib/f1";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-3xl",
} as const;

// Foto del piloto en un círculo; si no hay foto (o no carga), sus iniciales.
export function DriverAvatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo?: DriverPhoto | null | undefined;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-display font-bold",
        SIZES[size],
      )}
    >
      {photo && !failed ? (
        <img
          src={photo.url}
          alt={name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}