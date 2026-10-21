import { Link, getRouteApi } from "@tanstack/react-router";
import { ChevronRight, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { navItems } from "@/components/AppShell";

import { formatDate } from "@/lib/format";

const route = getRouteApi("/_privado/inicio");

export function HomePage() {
  const grandsPrix = route.useLoaderData();
  const next = grandsPrix.find((gp) => gp.status === "proximo");

  return (
    <>
      <PageHeader title="Inicio" subtitle="Tu resumen de la temporada." />
      {next && (
        <section className="relative overflow-hidden rounded-2xl border bg-hero p-6 shadow-glow md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Próxima carrera · Ronda {next.round}
          </p>
          <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-6xl">{next.name}</h2>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {next.circuit}, {next.country}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold capitalize">
            {formatDate(next.date, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
        </section>
      )}
      <h2 className="mb-3 mt-10 text-2xl font-bold uppercase">Accesos rápidos</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.slice(1).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 font-semibold">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}
