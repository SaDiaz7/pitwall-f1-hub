import { useState } from "react";
import { AvatarLightbox } from "@/components/AvatarLightbox";
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
// Con zoom, al clickear la foto se abre en grande (no usar dentro de un link).
export function DriverAvatar({
  name,
  photo,
  size = "md",
  zoom = false,
}: {
  name: string;
  photo?: DriverPhoto | null | undefined;
  size?: keyof typeof SIZES;
  zoom?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const avatar = (
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

  if (zoom && photo && !failed) {
    return (
      <AvatarLightbox src={photo.url} name={name}>
        {avatar}
      </AvatarLightbox>
    );
  }

  return avatar;
}