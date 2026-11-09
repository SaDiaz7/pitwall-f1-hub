import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Envuelve un avatar: al clickearlo, muestra la foto en grande.
// El visor se dibuja en el <body> (portal) para que ninguna tarjeta lo recorte.
export function AvatarLightbox({ src, name, children }: { src: string | null; name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
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
        className="shrink-0 rounded-full transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200 motion-reduce:animate-none"
            role="dialog"
            aria-modal="true"
            aria-label={`Foto de ${name}`}
          >
            <button
              type="button"
              aria-label="Cerrar"
              tabIndex={-1}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <img
              src={src}
              alt={`Foto de ${name}`}
              className="relative h-auto max-h-[85vh] w-auto max-w-[90vw] rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 fade-in duration-300 motion-reduce:animate-none sm:max-w-lg"
            />
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full bg-background/80 p-2 backdrop-blur transition active:scale-90 hover:bg-background motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}