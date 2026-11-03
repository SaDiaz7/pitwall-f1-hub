import { Link } from "@tanstack/react-router";
import { navItems } from "@/components/AppShell";

// Datos del campeón: para la próxima temporada alcanza con cambiar esto.
const CHAMPION = {
  year: 2026,
  name: "Kimi Antonelli",
  image: "/campeon-antonelli.jpg",
  eyebrow: "Nuevo campeón del mundo · 2026",
  text: "Se consagró en el GP de México, con 4 carreras todavía por delante. A los 20 años es el campeón más joven de la historia. El título ya tiene dueño, pero en PitWall la pelea sigue: seguí sumando puntos en Predicciones.",
  credit: "", // Ej.: "Foto: Wikipedia/Wikimedia Commons". Si queda vacío, no se muestra.
};

export function ChampionBanner() {
  const predictions = navItems.find((item) => item.label === "Predicciones");

  return (
    <section className="relative isolate flex h-full min-h-72 items-end overflow-hidden rounded-2xl border border-amber-400/40 bg-black p-6 md:items-center md:p-8">      <img
        src={CHAMPION.image}
        alt={`${CHAMPION.name}, campeón del mundo ${CHAMPION.year}`}
        draggable={false}
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[60%_15%]"
      />
      <div aria-hidden className="champion-overlay absolute inset-0 -z-10" />

      <div className="relative max-w-xl">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
          {CHAMPION.eyebrow}
        </p>
        <h2 className="gold-text mt-2 text-4xl font-bold uppercase italic md:text-6xl">
          {CHAMPION.name}
        </h2>
        <p className="mt-3 max-w-md text-sm text-white/85 md:text-base">{CHAMPION.text}</p>

        {predictions && (
          <Link
            to={predictions.to}
            className="mt-5 inline-flex items-center rounded-lg bg-[linear-gradient(to_right,#d97706,#fbbf24)] px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-105"
          >
            Sumá puntos en Predicciones →
          </Link>
        )}
      </div>

      {CHAMPION.credit && (
        <p className="absolute bottom-3 right-4 text-[10px] text-white/50">{CHAMPION.credit}</p>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[linear-gradient(to_right,#d97706,#fde047,#d97706)] opacity-70" />
    </section>
  );
}