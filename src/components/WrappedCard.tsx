import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Award, Flame, Layers, Target } from "lucide-react";
import { SEASON_END } from "@/lib/wrapped";

const SEASON = new Date(SEASON_END).getFullYear();

const HIGHLIGHTS = [
  { icon: Target, label: "Predicciones" },
  { icon: Flame, label: "Rachas" },
  { icon: Layers, label: "Álbum" },
  { icon: Award, label: "Insignias" },
];

export function WrappedCard() {
  const isFinal = Date.now() >= SEASON_END;

  return (
    <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Mi temporada</p>
          <Link to="/mi-temporada" className="hover:text-primary">
            <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-5xl">
              {isFinal ? `Tu temporada ${SEASON}` : `Tu ${SEASON} hasta ahora`}
            </h2>
          </Link>
          <p className="mt-3 text-muted-foreground">
            Tus puntos, tus rachas, tu álbum y tus insignias en un resumen para compartir. Se actualiza solo con cada
            carrera.
          </p>
          <Link
            to="/mi-temporada"
            className="mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            Ver mi resumen →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="fade-up flex flex-col items-center gap-2 rounded-xl border bg-card/60 p-4 text-center text-sm font-semibold"
                style={{ "--i": index } as CSSProperties}
              >
                <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
    </section>
  );
}