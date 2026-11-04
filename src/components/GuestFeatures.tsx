import { Link } from "@tanstack/react-router";
import { Flag, Heart, Image as ImageIcon, Medal, Target, Trophy } from "lucide-react";
import { MAX_POINTS } from "@/lib/predictions";

const FEATURES = [
  {
    icon: Target,
    title: "Predicciones",
    text: `Armá tu top 10 de cada carrera y sumá hasta ${MAX_POINTS} puntos.`,
  },
  {
    icon: Flag,
    title: "Ligas privadas",
    text: "Competí con tus amigos en una liga propia y ganá el trofeo de la temporada.",
  },
  {
    icon: Trophy,
    title: "Vitrina de trofeos",
    text: "Cada copa que ganes queda exhibida en tu perfil.",
  },
  {
    icon: Medal,
    title: "Ranking",
    text: "Mirá cómo te va contra toda la comunidad y contra tus amigos.",
  },
  {
    icon: Heart,
    title: "Favoritos",
    text: "Marcá tus pilotos y equipos y seguilos desde tu propio inicio.",
  },
  {
    icon: ImageIcon,
    title: "Fondos con likes",
    text: "Dá likes y descargá fondos de pantalla en alta calidad.",
  },
];

export function GuestFeatures() {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold uppercase">Con tu cuenta, además</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Podés seguir mirando el calendario, el campeonato y los fondos sin registrarte. Si querés ir más lejos:
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl border bg-card p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-lg font-bold uppercase">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/registro"
          className="flex h-11 items-center justify-center rounded-md bg-gradient-primary px-6 text-sm font-bold uppercase tracking-wide text-primary-foreground"
        >
          Crear cuenta
        </Link>
        <Link
          to="/login"
          className="flex h-11 items-center justify-center rounded-md border px-6 text-sm font-semibold hover:bg-accent/40"
        >
          Ya tengo cuenta
        </Link>
      </div>
    </section>
  );
}