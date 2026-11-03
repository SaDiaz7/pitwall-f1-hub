import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  key: string;
  content: ReactNode;
  // Clase de sombra (el "brillo") que se ve mientras esta tarjeta está activa.
  glow: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoplayMs?: number;
}

const ARROW_CLASS =
  "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-background/70 text-foreground backdrop-blur transition hover:scale-105 hover:bg-background md:flex";

export function HeroCarousel({ slides, autoplayMs = 6000 }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onDown = () => setDragging(true);
    const onUp = () => setDragging(false);

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("pointerDown", onDown);
    emblaApi.on("pointerUp", onUp);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("pointerDown", onDown);
      emblaApi.off("pointerUp", onUp);
    };
  }, [emblaApi]);

  // Siguiente / anterior. Al llegar al final (o al principio) da la vuelta.
  const goNext = useCallback(() => {
    if (!emblaApi) return;
    if (emblaApi.canScrollNext()) emblaApi.scrollNext();
    else emblaApi.scrollTo(0);
  }, [emblaApi]);

  const goPrev = useCallback(() => {
    if (!emblaApi) return;
    if (emblaApi.canScrollPrev()) emblaApi.scrollPrev();
    else emblaApi.scrollTo(emblaApi.scrollSnapList().length - 1);
  }, [emblaApi]);

  // Avance automático. Se reinicia cada vez que cambia la tarjeta (a mano o solo).
  const paused = hovering || focused || dragging;
  useEffect(() => {
    if (!emblaApi || paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (!document.hidden) goNext();
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [emblaApi, paused, slides.length, autoplayMs, selected, goNext]);

  if (slides.length === 0) return null;

  const active = slides[Math.min(selected, slides.length - 1)];
  const manySlides = slides.length > 1;

  return (
    <div
      aria-roledescription="carousel"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
    >
      <div className="relative">
        {/* Brillo detrás del carrusel: queda fuera del recorte, así no se corta a los costados */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl transition-shadow duration-700",
            active?.glow,
          )}
        />

        <div ref={emblaRef} className="relative overflow-x-clip">
          <div className="flex touch-pan-y touch-pinch-zoom">
            {slides.map((slide) => (
              <div key={slide.key} className="min-w-0 shrink-0 grow-0 basis-full">
                {slide.content}
              </div>
            ))}
          </div>
        </div>

        {manySlides && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Tarjeta anterior"
              className={cn(ARROW_CLASS, "left-3")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Tarjeta siguiente"
              className={cn(ARROW_CLASS, "right-3")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {manySlides && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir a la tarjeta ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === selected
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}