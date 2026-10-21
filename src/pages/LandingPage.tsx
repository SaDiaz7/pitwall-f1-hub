import { Link } from "@tanstack/react-router";
import { CalendarDays, Heart, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const features = [
  {
    icon: CalendarDays,
    title: "Calendario y resultados",
    text: "Todos los Grandes Premios de la temporada, en un solo lugar.",
  },
  {
    icon: Trophy,
    title: "Tablas de pilotos y constructores",
    text: "Seguí la pelea por el campeonato carrera a carrera.",
  },
  {
    icon: Heart,
    title: "Pilotos favoritos",
    text: "Armá tu lista y seguí de cerca a quienes más te importan.",
  },
  {
    icon: Sparkles,
    title: "Predicciones",
    text: "Anticipá el podio y competí con otros fans.",
    soon: true,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Logo />
          <Link
            to="/login"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Iniciar sesión
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 md:pb-32 md:pt-24">
          <p className="mb-4 inline-block rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Temporada 2026
          </p>
          <h1 className="max-w-3xl text-6xl font-bold uppercase italic leading-[0.9] md:text-8xl">
            Tu muro de boxes <span className="text-primary">personal</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Calendario, resultados y campeonatos de la Fórmula 1, pensados para fans que viven cada
            vuelta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gradient-primary px-8 font-semibold uppercase tracking-wide shadow-glow"
            >
              <Link to="/registro">Crear cuenta</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 font-semibold uppercase tracking-wide"
            >
              <Link to="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 racing-stripe opacity-60" />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl font-bold uppercase italic md:text-5xl">Todo lo que necesitás</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text, soon }) => (
            <article
              key={title}
              className="group relative rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50"
            >
              {soon && (
                <span className="absolute right-4 top-4 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Próximamente
                </span>
              )}
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-2xl font-bold uppercase leading-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© 2026 PitWall · Proyecto de fans, sin afiliación oficial con la Fórmula 1.</p>
        </div>
      </footer>
    </div>
  );
}
