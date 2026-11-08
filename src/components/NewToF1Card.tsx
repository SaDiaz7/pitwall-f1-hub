import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pitwall-bienvenida-cerrada";

// Invitación para quien recién llega a la F1. Se puede cerrar y no vuelve a aparecer.
export function NewToF1Card({ className }: { className?: string | undefined }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Si el navegador no deja guardar, la tarjeta vuelve a aparecer la próxima vez.
    }
  };

  if (!visible) return null;

  return (
    <section
      className={cn(
        "fade-up relative overflow-hidden rounded-2xl border border-primary/40 bg-hero p-5 md:p-6",
        className,
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="No mostrar más este aviso"
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-all hover:bg-accent/40 hover:text-foreground active:scale-90"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-xs font-bold uppercase tracking-widest text-primary">Para quien recién llega</p>
      <h2 className="mt-1 pr-8 font-display text-3xl font-bold uppercase md:text-4xl">¿Sos nuevo en la F1?</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Te explicamos todo desde cero: qué es una clasificación, cómo se reparten los puntos, qué significa cada bandera.
        Y después ponete a prueba con un quiz de 8 preguntas.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          to="/guia"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        >
          <BookOpen className="h-4 w-4" /> Leer la guía
        </Link>
        <Link
          to="/quiz"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:bg-accent/40 active:scale-95"
        >
          <GraduationCap className="h-4 w-4" /> Hacer el quiz
        </Link>
      </div>
    </section>
  );
}