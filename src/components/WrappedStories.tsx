import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Flame, Share2 } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { CountUp } from "@/components/CountUp";
import { CountryFlag } from "@/components/CountryFlag";
import { StickerCard } from "@/components/StickerCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/hooks/useProfile";
import { BADGES, TIER_NAMES, tierOf, type BadgeStats } from "@/lib/badges";
import { getTeamColor } from "@/lib/team-colors";
import { shareImageBlob } from "@/lib/card-share";
import { renderWrappedCard } from "@/lib/wrapped-card";
import { prettyName, teamLabel, type WrappedData } from "@/lib/wrapped";
import { cn } from "@/lib/utils";

const TIER_COLORS = ["#52525b", "#cd7f32", "#cbd5e1", "#fbbf24"] as const;
const DEFAULT_ACCENT = "#e10600";

interface SlideDef {
  key: string;
  node: ReactNode;
}

function stagger(index: number): CSSProperties {
  return { "--i": Math.min(index, 9) } as CSSProperties;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="fade-up text-xs font-bold uppercase tracking-[0.25em] text-white/70" style={stagger(0)}>
      {children}
    </p>
  );
}

function Big({
  value,
  label,
  index = 1,
}: {
  value: number;
  label: string;
  index?: number;
}) {
  return (
    <div className="fade-up" style={stagger(index)}>
      <p className="font-display text-8xl font-bold leading-none tabular-nums">
        <CountUp to={value} />
      </p>
      <p className="mt-1 text-sm uppercase tracking-wider text-white/70">{label}</p>
    </div>
  );
}

function Line({ children, index }: { children: ReactNode; index: number }) {
  return (
    <p className="fade-up text-base text-white/90" style={stagger(index)}>
      {children}
    </p>
  );
}

function Chip({ children, color }: { children: ReactNode; color?: string | undefined }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
      {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </span>
  );
}

// ---------- Láminas ----------

function IntroSlide({ data, isFinal }: { data: WrappedData; isFinal: boolean }) {
  const profile = data.profile;
  const name = profile?.display_name || profile?.username || "Piloto";
  const since = profile
    ? new Date(profile.member_since).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
    : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <Eyebrow>PitWall · {data.season}</Eyebrow>
      <div className="fade-up" style={stagger(1)}>
        <Avatar className="h-24 w-24 border-2 border-white/30">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
          <AvatarFallback className="bg-gradient-primary font-display text-3xl text-primary-foreground">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </div>
      <h2 className="fade-up font-display text-6xl font-bold uppercase italic leading-none" style={stagger(2)}>
        {isFinal ? `Tu temporada ${data.season}` : `Tu ${data.season} hasta ahora`}
      </h2>
      <p className="fade-up flex items-center justify-center gap-2 text-lg font-semibold" style={stagger(3)}>
        {profile?.country && <CountryFlag code={profile.country} className="h-4" />}
        {name}
      </p>
      {since && (
        <p className="fade-up text-sm text-white/70" style={stagger(4)}>
          En PitWall desde el {since}
        </p>
      )}
      <p className="fade-up mt-4 text-xs uppercase tracking-widest text-white/60" style={stagger(5)}>
        Tocá para avanzar →
      </p>
    </div>
  );
}

function PredictionsSlide({ data }: { data: WrappedData }) {
  const p = data.predictions;

  if (p.scored_races === 0) {
    return (
      <div className="flex h-full flex-col justify-center gap-4">
        <Eyebrow>Predicciones</Eyebrow>
        <h2 className="fade-up font-display text-5xl font-bold uppercase leading-none" style={stagger(1)}>
          Tu primera predicción te espera
        </h2>
        <Line index={2}>
          Todavía no se puntuó ninguna carrera con tu predicción. ¡Hacé la próxima y empezá a sumar!
        </Line>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-5">
      <Eyebrow>Predicciones</Eyebrow>
      <Big value={p.points} label="puntos en tus predicciones" index={1} />
      <Line index={2}>
        Participaste en {p.scored_races} de las {p.season_races} carreras puntuadas
        {p.avg_points !== null && ` · ${p.avg_points} puntos de promedio`}
      </Line>
      {p.rank !== null && p.players !== null && (
        <Line index={3}>
          Puesto <span className="font-bold">#{p.rank}</span> de {p.players} en el ranking general
        </Line>
      )}
      {p.friends_rank !== null && p.friends_count !== null && p.friends_count > 1 && (
        <Line index={4}>
          y <span className="font-bold">#{p.friends_rank}</span> de {p.friends_count} entre tus amigos
        </Line>
      )}
    </div>
  );
}

function BestRaceSlide({ data }: { data: WrappedData }) {
  const p = data.predictions;
  const best = p.best_race;
  if (!best) return null;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Tu mejor carrera</Eyebrow>
      <h2 className="fade-up font-display text-5xl font-bold uppercase italic leading-none" style={stagger(1)}>
        {best.race ?? `Ronda ${best.round}`}
      </h2>
      <Big value={best.points} label="puntos en esa carrera" index={2} />
      <Line index={3}>
        {p.exact_hits} {p.exact_hits === 1 ? "piloto clavado" : "pilotos clavados"} en su puesto exacto
      </Line>
      {p.perfect_podiums > 0 && (
        <Line index={4}>
          {p.perfect_podiums} {p.perfect_podiums === 1 ? "podio perfecto" : "podios perfectos"} 🏆
        </Line>
      )}
      {p.top_winner_pick && (
        <Line index={5}>
          Tu ganador preferido: <span className="font-bold">{prettyName(p.top_winner_pick.driver_name)}</span> (
          {p.top_winner_pick.count} {p.top_winner_pick.count === 1 ? "vez" : "veces"})
        </Line>
      )}
    </div>
  );
}

function GamesSlide({ data }: { data: WrappedData }) {
  const g = data.games;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Juegos diarios</Eyebrow>
      <Big value={g.days_played} label={g.days_played === 1 ? "día jugado" : "días jugados"} index={1} />
      {g.streak_best > 0 && (
        <Line index={2}>
          <span className="inline-flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-orange-400" /> Racha máxima: <span className="font-bold">{g.streak_best}</span>{" "}
            {g.streak_best === 1 ? "día" : "días"}
          </span>
        </Line>
      )}
      {g.circuit_played > 0 && (
        <Line index={3}>
          {g.circuit_solved} {g.circuit_solved === 1 ? "circuito resuelto" : "circuitos resueltos"}
          {g.circuit_first_try > 0 && ` · ${g.circuit_first_try} al primer intento`}
        </Line>
      )}
      {g.circuit_avg_attempts !== null && <Line index={4}>Promedio: {g.circuit_avg_attempts} intentos por circuito</Line>}
      {g.hl_days > 0 && (
        <Line index={5}>
          {g.hl_duels} duelos de ¿Más o menos?
          {g.hl_avg !== null && ` · promedio ${g.hl_avg}/10`}
          {g.hl_perfect > 0 && ` · ${g.hl_perfect} ${g.hl_perfect === 1 ? "perfecto" : "perfectos"}`}
        </Line>
      )}
    </div>
  );
}

function AlbumSlide({ data }: { data: WrappedData }) {
  const a = data.album;
  const pct = a.catalog > 0 ? Math.round((a.distinct / a.catalog) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Tu álbum</Eyebrow>
      <Big value={a.cards} label={a.cards === 1 ? "carta conseguida" : "cartas conseguidas"} index={1} />
      <div className="fade-up space-y-1" style={stagger(2)}>
        <AnimatedBar percent={pct} color="#ffffff" className="h-2 bg-white/20" />
        <p className="text-sm text-white/80">
          {a.distinct} de {a.catalog} distintas · {pct}% completado
        </p>
      </div>
      <div className="fade-up flex items-center gap-4" style={stagger(3)}>
        {a.rarest && (
          <div className="w-32 shrink-0">
            <StickerCard card={a.rarest} foil={a.rarest.foil} />
          </div>
        )}
        <ul className="space-y-1 text-sm text-white/90">
          {a.rarest && <li className="text-xs uppercase tracking-wider text-white/60">Tu carta más rara</li>}
          <li>
            {a.foil} {a.foil === 1 ? "carta foil" : "cartas foil"} ✨
          </li>
          <li>
            {a.packs} {a.packs === 1 ? "sobre abierto" : "sobres abiertos"}
          </li>
          <li>
            {a.trades} {a.trades === 1 ? "intercambio" : "intercambios"}
          </li>
        </ul>
      </div>
    </div>
  );
}

function FavoritesSlide({ data }: { data: WrappedData }) {
  const { dotd, favorites } = data;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Tus favoritos</Eyebrow>
      {dotd.top_voted && (
        <>
          <h2 className="fade-up font-display text-5xl font-bold uppercase italic leading-none" style={stagger(1)}>
            {prettyName(dotd.top_voted.driver_name)}
          </h2>
          <Line index={2}>
            Tu Piloto del día más votado: {dotd.top_voted.count} de tus {dotd.votes}{" "}
            {dotd.votes === 1 ? "voto" : "votos"}
          </Line>
        </>
      )}
      {favorites.drivers.length > 0 && (
        <div className="fade-up space-y-2" style={stagger(3)}>
          <p className="text-xs uppercase tracking-wider text-white/60">Pilotos favoritos</p>
          <div className="flex flex-wrap gap-2">
            {favorites.drivers.map((driver) => (
              <Chip key={driver.driver_id}>{prettyName(driver.driver_name)}</Chip>
            ))}
          </div>
        </div>
      )}
      {favorites.teams.length > 0 && (
        <div className="fade-up space-y-2" style={stagger(4)}>
          <p className="text-xs uppercase tracking-wider text-white/60">Escuderías favoritas</p>
          <div className="flex flex-wrap gap-2">
            {favorites.teams.map((team) => (
              <Chip key={team} color={getTeamColor(team, undefined)}>
                {teamLabel(team)}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SocialSlide({ data }: { data: WrappedData }) {
  const s = data.social;

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Tu comunidad</Eyebrow>
      <Big value={s.friends} label={s.friends === 1 ? "amigo en PitWall" : "amigos en PitWall"} index={1} />
      {s.leagues > 0 && (
        <Line index={2}>
          {s.leagues} {s.leagues === 1 ? "liga" : "ligas"}
        </Line>
      )}
      {s.trophies.map((trophy, index) => (
        <Line key={`${trophy.league_name}-${index}`} index={3 + index}>
          🏆 {trophy.league_name}: {trophy.total_points} pts entre {trophy.member_count}
        </Line>
      ))}
      {s.wallpaper_likes > 0 && (
        <Line index={5}>
          {s.wallpaper_likes} {s.wallpaper_likes === 1 ? "fondo" : "fondos"} que te gustaron
        </Line>
      )}
      {s.bingo_marked > 0 && (
        <Line index={6}>
          {s.bingo_marked} {s.bingo_marked === 1 ? "casilla marcada" : "casillas marcadas"} en el Bingo
        </Line>
      )}
    </div>
  );
}

function BadgesSlide({ stats }: { stats: BadgeStats }) {
  const rows = BADGES.map((def) => ({ def, tier: tierOf(def, def.value(stats)) }));
  const earned = rows.filter((row) => row.tier > 0).sort((a, b) => b.tier - a.tier);

  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <Eyebrow>Insignias</Eyebrow>
      <Big value={earned.length} label={`de ${rows.length} insignias desbloqueadas`} index={1} />
      {earned.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2">
          {earned.slice(0, 8).map(({ def, tier }, index) => {
            const Icon = def.icon;
            return (
              <li
                key={def.id}
                className="fade-up flex items-center gap-2 rounded-xl bg-white/10 p-2"
                style={stagger(index + 2)}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: TIER_COLORS[tier] }}
                >
                  <Icon className="h-4 w-4 text-black/80" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold">{def.name}</span>
                  <span className="block text-[10px] uppercase tracking-wide text-white/60">{TIER_NAMES[tier]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <Line index={2}>Todavía no desbloqueaste ninguna. Con los juegos y las predicciones vas a empezar a sumar.</Line>
      )}
    </div>
  );
}

function ClosingSlide({
  data,
  isFinal,
  onRestart,
  onShare,
  sharing,
  message,
}: {
  data: WrappedData;
  isFinal: boolean;
  onRestart: () => void;
  onShare: () => void;
  sharing: boolean;
  message: string | null;
}) {
  const stats = [
    { value: data.predictions.points, label: "puntos" },
    { value: data.album.cards, label: "cartas" },
    { value: data.games.streak_best, label: "racha máx." },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <Eyebrow>PitWall · {data.season}</Eyebrow>
      <h2 className="fade-up font-display text-5xl font-bold uppercase italic leading-none" style={stagger(1)}>
        ¡Gracias por correr con nosotros!
      </h2>
      <div className="fade-up grid w-full grid-cols-3 gap-2" style={stagger(2)}>
        {stats.map((item) => (
          <div key={item.label} className="rounded-xl bg-white/10 p-3">
            <p className="font-display text-3xl font-bold leading-none tabular-nums">{item.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-white/70">{item.label}</p>
          </div>
        ))}
      </div>
      <p className="fade-up text-sm text-white/80" style={stagger(3)}>
        {isFinal ? "¡Nos vemos en la próxima temporada!" : "Todavía quedan carreras: tu resumen se actualiza solo."}
      </p>
      <div className="pointer-events-auto fade-up flex flex-wrap justify-center gap-2" style={stagger(4)}>
        <button
          type="button"
          onClick={onShare}
          disabled={sharing}
          className="inline-flex items-center rounded-lg bg-gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
        >
          <Share2 className="mr-2 h-4 w-4" /> {sharing ? "Generando…" : "Compartir imagen"}
        </button>
        <Link
          to="/inicio"
          className="inline-flex items-center rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold transition-transform hover:bg-white/10 active:scale-95"
        >
          Volver al inicio
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold transition-transform hover:bg-white/10 active:scale-95"
        >
          Ver de nuevo
        </button>
      </div>
      {message && <p className="pointer-events-auto text-xs text-white/80">{message}</p>}
    </div>
  );
}

function buildSlides(
  data: WrappedData,
  badgeStats: BadgeStats | null,
  isFinal: boolean,
  onRestart: () => void,
  share: { onShare: () => void; sharing: boolean; message: string | null },
): SlideDef[] {
  const slides: SlideDef[] = [
    { key: "intro", node: <IntroSlide data={data} isFinal={isFinal} /> },
    { key: "predicciones", node: <PredictionsSlide data={data} /> },
  ];

  if (data.predictions.best_race) slides.push({ key: "mejor-carrera", node: <BestRaceSlide data={data} /> });
  if (data.games.days_played > 0) slides.push({ key: "juegos", node: <GamesSlide data={data} /> });
  slides.push({ key: "album", node: <AlbumSlide data={data} /> });

  if (data.dotd.top_voted || data.favorites.drivers.length > 0 || data.favorites.teams.length > 0) {
    slides.push({ key: "favoritos", node: <FavoritesSlide data={data} /> });
  }

  slides.push({ key: "comunidad", node: <SocialSlide data={data} /> });
  if (badgeStats) slides.push({ key: "insignias", node: <BadgesSlide stats={badgeStats} /> });

  slides.push({
    key: "cierre",
    node: (
      <ClosingSlide
        data={data}
        isFinal={isFinal}
        onRestart={onRestart}
        onShare={share.onShare}
        sharing={share.sharing}
        message={share.message}
      />
    ),
  });

  return slides;
}

// ---------- Visor ----------

export function WrappedStories({
  data,
  badgeStats,
  isFinal,
}: {
  data: WrappedData;
  badgeStats: BadgeStats | null;
  isFinal: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);

  const favoriteTeam = data.favorites.teams[0];
  const accent = favoriteTeam ? getTeamColor(favoriteTeam, undefined) : DEFAULT_ACCENT;

  const restart = useCallback(() => setIndex(0), []);

  const onShare = async () => {
    setSharing(true);
    setMessage(null);
    try {
      const blob = await renderWrappedCard(data, isFinal, accent);
      const result = await shareImageBlob(
        blob,
        "pitwall-mi-temporada.png",
        `Mi ${data.season} en PitWall 🏁 ${window.location.origin}`,
      );
      if (result === "downloaded") setMessage("Imagen descargada.");
    } catch (shareError) {
      // Si la persona cierra el menú de compartir no es un error.
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) {
        console.error("Compartir Mi temporada:", shareError);
        setMessage("No pudimos generar la imagen.");
      }
    } finally {
      setSharing(false);
    }
  };

  const slides = buildSlides(data, badgeStats, isFinal, restart, {
    onShare: () => void onShare(),
    sharing,
    message,
  });
  const last = slides.length - 1;

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => Math.max(0, Math.min(last, current + delta)));
    },
    [last],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const pct = data.album.catalog > 0 ? Math.round((data.album.distinct / data.album.catalog) * 100) : 0;
  const tiles = [
    { label: "Puntos", value: String(data.predictions.points) },
    { label: "Puesto", value: data.predictions.rank !== null ? `#${data.predictions.rank}` : "—" },
    { label: "Racha máxima", value: `${data.games.streak_best} d` },
    { label: "Días jugados", value: String(data.games.days_played) },
    { label: "Circuitos resueltos", value: String(data.games.circuit_solved) },
    { label: "Promedio duelos", value: data.games.hl_avg !== null ? `${data.games.hl_avg}/10` : "—" },
    { label: "Cartas", value: String(data.album.cards) },
    { label: "Álbum completado", value: `${pct}%` },
    { label: "Amigos", value: String(data.social.friends) },
  ];

  const current = slides[index];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className="mx-auto w-full max-w-sm space-y-3 lg:mx-0">
        <div
          className="relative h-[min(72dvh,42rem)] w-full overflow-hidden rounded-3xl border border-white/10 text-white shadow-glow"
          style={{ backgroundImage: `linear-gradient(165deg, color-mix(in oklab, ${accent} 60%, #000) 0%, #0b0b0d 85%)` }}
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const end = event.changedTouches[0]?.clientX;
            touchStart.current = null;
            if (start === null || end === undefined) return;
            const delta = end - start;
            if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
          }}
        >
          <div className="absolute inset-x-3 top-3 z-30 flex gap-1" aria-hidden="true">
            {slides.map((slide, i) =>
              i < index ? (
                <div key={slide.key} className="h-1 flex-1 rounded-full bg-white/80" />
              ) : i === index ? (
                <AnimatedBar key={`${slide.key}-${index}`} percent={100} color="#ffffff" className="h-1 flex-1 bg-white/20" />
              ) : (
                <div key={slide.key} className="h-1 flex-1 rounded-full bg-white/20" />
              ),
            )}
          </div>

          <button
            type="button"
            aria-label="Lámina anterior"
            onClick={() => go(-1)}
            className="absolute inset-y-0 left-0 z-10 w-1/3"
          />
          {index < last && (
            <button
              type="button"
              aria-label="Lámina siguiente"
              onClick={() => go(1)}
              className="absolute inset-y-0 right-0 z-10 w-2/3"
            />
          )}

          <div key={index} className="pointer-events-none relative z-20 h-full px-6 pb-6 pt-10">
            {current?.node}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === 0}
            onClick={() => go(-1)}
            className="transition-transform active:scale-95"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {index + 1}/{slides.length}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={index === last}
            onClick={() => go(1)}
            className="transition-transform active:scale-95"
          >
            Siguiente <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <aside className="hidden space-y-3 lg:block">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tu resumen en números</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {tiles.map((tile, tileIndex) => (
            <div key={tile.label} className="fade-up rounded-xl border bg-card p-4" style={stagger(tileIndex)}>
              <p className="font-display text-3xl font-bold leading-none tabular-nums">{tile.value}</p>
              <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{tile.label}</p>
            </div>
          ))}
        </div>
        <Button
          type="button"
          disabled={sharing}
          onClick={() => void onShare()}
          className="bg-gradient-primary font-semibold transition-transform active:scale-95"
        >
          <Share2 className="mr-2 h-4 w-4" /> {sharing ? "Generando…" : "Compartir mi resumen"}
        </Button>
        {message && <p className="text-xs text-muted-foreground">{message}</p>}
      </aside>
    </div>
  );
}