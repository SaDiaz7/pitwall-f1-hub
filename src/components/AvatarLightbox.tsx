import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

// Envuelve un avatar: al clickearlo, muestra la foto en grande.
export function AvatarLightbox({ src, name, children }: { src: string | null; name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Sin foto no hay nada para agrandar: se muestran las iniciales como siempre.
  if (!src) return <>{children}</>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ver la foto de ${name} en grande`}
        className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${name}`}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/80"
            onClick={() => setOpen(false)}
          />
          <img
            src={src}
            alt={`Foto de ${name}`}
            className="relative h-auto max-h-[85vh] w-[min(90vw,28rem)] rounded-2xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full bg-background/80 p-2 backdrop-blur transition-colors hover:bg-background"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}