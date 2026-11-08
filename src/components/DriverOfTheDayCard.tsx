import { Link } from "@tanstack/react-router";
import { DriverAvatar } from "@/components/DriverAvatar";
import { useDriverPhotos } from "@/hooks/useDriverPhotos";
import type { RaceResult } from "@/lib/f1";
import type { Driver, GrandPrix } from "@/lib/types";

export function DriverOfTheDayCard({
  gp,
  results,
  drivers,
  myVote,
}: {
  gp: GrandPrix;
  results: RaceResult[];
  drivers: Driver[];
  myVote: string | null;
}) {
  const top: { driverId: string; name: string }[] =
    results.length > 0
      ? results.slice(0, 5)
      : drivers.slice(0, 5).map((driver) => ({ driverId: driver.id, name: driver.name }));
  const wikiById = new Map(drivers.map((driver) => [driver.id, driver.wikiUrl ?? null]));
  const photos = useDriverPhotos(top.map((r) => ({ id: r.driverId, wikiUrl: wikiById.get(r.driverId) ?? null })));
  const votedName = myVote ? (results.find((r) => r.driverId === myVote)?.name ?? null) : null;

  return (
    <section className="relative h-full overflow-hidden rounded-2xl border bg-hero p-6 md:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_16rem]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Piloto del día · {gp.name}</p>
          <Link to="/gp/$round" params={{ round: String(gp.round) }} className="hover:text-primary">
            <h2 className="mt-2 text-4xl font-bold uppercase italic md:text-5xl">¿Quién fue el mejor?</h2>
          </Link>
          <p className="mt-3 text-muted-foreground">
            {votedName
              ? `Votaste por ${votedName}. Mirá cómo viene la votación.`
              : "Votá al mejor piloto de la carrera y mirá qué piensa la comunidad."}
          </p>
          <Link
            to="/gp/$round"
            params={{ round: String(gp.round) }}
            className="mt-4 inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105"
          >
            {votedName ? "Ver resultados →" : "Votar ahora →"}
          </Link>
        </div>

        <ul className="flex justify-center -space-x-4 md:justify-end">
          {top.map((r) => (
            <li
              key={r.driverId}
              className="rounded-full ring-2 ring-background transition-transform hover:-translate-y-1"
            >
              <DriverAvatar name={r.name} photo={photos[r.driverId] ?? null} size="lg" />
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 racing-stripe opacity-60" />
    </section>
  );
}