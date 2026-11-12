import { useEffect, useState, type CSSProperties } from "react";
import { Flame } from "lucide-react";
import { AnimatedBar } from "@/components/AnimatedBar";
import { BadgeMedal, MedalDefs } from "@/components/BadgeMedal";
import { supabase } from "@/integrations/supabase/client";
import { BADGES, TIER_NAMES, tierOf, type BadgeStats, type Tier } from "@/lib/badges";
import { cn } from "@/lib/utils";

const TIER_TEXT: Record<Tier, string> = {
  0: "text-muted-foreground",
  1: "text-orange-300",
  2: "text-slate-300",
  3: "text-amber-300",
};

function StreakBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-secondary/30 p-3">
      <Flame className={cn("h-8 w-8 shrink-0", value > 0 ? "text-orange-400" : "text-muted-foreground/40")} />
      <div>
        <p className="font-display text-2xl font-bold leading-none tabular-nums">
          {value}{" "}
          <span className="text-xs font-normal text-muted-foreground">{value === 1 ? "día" : "días"}</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function BadgeShowcase({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  // undefined = cargando, null = no disponible (perfil privado o error).
  const [stats, setStats] = useState<BadgeStats | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setStats(undefined);

    Promise.all([
      supabase.rpc("get_profile_badge_stats", { p_user_id: userId }),
      supabase.rpc("get_profile_album", { p_user_id: userId }),
    ]).then(([badges, album]) => {
      if (cancelled) return;

      const row = badges.data?.[0];
      if (badges.error || !row) {
        if (badges.error) console.error("Cargar insignias:", badges.error);
        setStats(null);
        return;
      }

      // Si el álbum falla, las insignias de cartas quedan en cero y el resto se ve igual.
      const summary = album.error ? undefined : album.data?.[0];
      setStats({
        ...row,
        album_owned: summary?.owned_count ?? 0,
        album_foils: summary?.foil_count ?? 0,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (stats === undefined) {
    return (
      <section className="rounded-2xl border bg-card p-5">
        <div className="skeleton h-48 w-full" />
      </section>
    );
  }
  if (stats === null) return null;

  const rows = BADGES.map((def) => {
    const value = def.value(stats);
    return { def, value, tier: tierOf(def, value) };
  });
  const earned = rows.filter((row) => row.tier > 0).length;
  // En el perfil de otra persona solo se muestran las que ganó.
  const shown = isSelf ? rows : rows.filter((row) => row.tier > 0);

  if (!isSelf && shown.length === 0 && stats.streak_best === 0) return null;

  return (
    <section className="fade-up rounded-2xl border bg-card p-5">
      <MedalDefs />

      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold uppercase">Insignias</h2>
        <p className="text-xs text-muted-foreground">
          {earned} de {BADGES.length} desbloqueadas
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StreakBox label="Racha actual" value={stats.streak_current} />
        <StreakBox label="Mejor racha" value={stats.streak_best} />
      </div>

      {shown.length > 0 && (
        <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-3">
          {shown.map(({ def, value, tier }, index) => {
            const next = tier === 3 ? null : def.targets[tier];

            return (
              <li
                key={def.id}
                title={def.description}
                className={cn(
                  "fade-up flex flex-col items-center gap-1.5 rounded-xl border bg-secondary/30 p-3 text-center",
                  tier === 0 && "opacity-80",
                )}
                style={{ "--i": Math.min(index, 8) } as CSSProperties}
              >
                <BadgeMedal
                  tier={tier}
                  icon={def.icon}
                  className="transition-transform hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100"
                />
                <p className="font-display text-base font-bold uppercase leading-tight">{def.name}</p>
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", TIER_TEXT[tier])}>
                  {TIER_NAMES[tier]}
                </p>

                {isSelf ? (
                  <>
                    <p className="line-clamp-2 text-[11px] text-muted-foreground">{def.description}</p>
                    {next !== null ? (
                      <div className="w-full space-y-1">
                        <AnimatedBar percent={Math.min(100, (value / next) * 100)} />
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {value}/{next} {def.unit}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] tabular-nums text-muted-foreground">
                        {value} {def.unit} · nivel máximo
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {value} {def.unit}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}