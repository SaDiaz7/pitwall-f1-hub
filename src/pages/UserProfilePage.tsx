import { useEffect, useMemo, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFriends, type FriendResult } from "@/hooks/useFriends";
import { getInitials } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { breakdown } from "@/lib/predictions";
import { cn } from "@/lib/utils";
import { ProfileFavorites } from "@/components/ProfileFavorites";
import { TrophyShowcase } from "@/components/TrophyShowcase";
import { BadgeShowcase } from "@/components/BadgeShowcase";
import { AvatarLightbox } from "@/components/AvatarLightbox";
import { CountryFlag } from "@/components/CountryFlag";
import { countryName } from "@/lib/countries";
import { AlbumShowcase } from "@/components/AlbumShowcase";
import { ProfileHeader } from "@/components/ProfileHeader";

const route = getRouteApi("/_privado/usuario/$id");

interface PublicProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  header_url: string | null;
  header_pos_x: number;
  header_pos_y: number;
  header_zoom: number;
  country: string | null;
  total_points: number;
  scored_races: number;
  relation: string;
}

interface FriendPrediction {
  round: number;
  race_name: string;
  picks: string[];
  points: number | null;
  results: string[] | null;
}

type Message = { type: "ok" | "error"; text: string } | null;

export function UserProfilePage() {
  const { id } = route.useParams();
  const { drivers, teams } = route.useLoaderData();
  const season = new Date().getFullYear();

  const { session } = useSession();
  const userId = session?.user.id;
  const friends = useFriends();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [predictions, setPredictions] = useState<FriendPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState<Message>(null);

  const names = useMemo(() => new Map(drivers.map((d) => [d.id, d.name])), [drivers]);
  const nameOf = (driverId: string | null) => (driverId ? (names.get(driverId) ?? driverId) : "—");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: id, p_season: season });
      if (cancelled) return;

      const row = error ? null : (data?.[0] ?? null);
      if (error) console.error("Cargar perfil:", error);
      setProfile(row);

      if (row?.relation === "friends") {
        const result = await supabase.rpc("get_friend_predictions", { p_user_id: id, p_season: season });
        if (!cancelled) setPredictions(result.error ? [] : (result.data ?? []));
      } else {
        setPredictions([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, season, userId, refresh]);

  const run = async (action: () => Promise<FriendResult>) => {
    setMessage(null);
    const result = await action();
    setMessage({ type: result.ok ? "ok" : "error", text: result.message });
    setRefresh((n) => n + 1);
  };

  const back = (
    <Link
      to="/amigos"
      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Volver a amigos
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <div className="skeleton h-32 w-full sm:h-44 lg:h-52" />
      </>
    );
  }

  if (!profile) {
    return (
      <>
        {back}
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Este perfil no está disponible: puede ser privado o no existir.
        </div>
      </>
    );
  }

  const buttonClass = "transition-transform active:scale-95";

  return (
    <>
      {back}

      <ProfileHeader
        profile={profile}
        isSelf={profile.relation === "self"}
        onSaved={() => setRefresh((n) => n + 1)}
        actions={
          <>
            {profile.relation === "none" && (
              <Button type="button" className={buttonClass} onClick={() => run(() => friends.sendRequest(profile.user_id))}>
                Agregar amigo
              </Button>
            )}
            {profile.relation === "pending_sent" && (
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                onClick={() => run(() => friends.remove(profile.user_id))}
              >
                Cancelar pedido
              </Button>
            )}
            {profile.relation === "pending_received" && (
              <>
                <Button type="button" className={buttonClass} onClick={() => run(() => friends.respond(profile.user_id, true))}>
                  Aceptar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={buttonClass}
                  onClick={() => run(() => friends.respond(profile.user_id, false))}
                >
                  Rechazar
                </Button>
              </>
            )}
            {profile.relation === "friends" && (
              <Button
                type="button"
                variant="outline"
                className={buttonClass}
                onClick={() => {
                  if (window.confirm("¿Quitar a esta persona de tus amigos?")) {
                    void run(() => friends.remove(profile.user_id));
                  }
                }}
              >
                Quitar de amigos
              </Button>
            )}
          </>
        }
      />

      {message && (
        <p
          className={cn(
            "mb-4 rounded-md p-2 text-sm",
            message.type === "ok" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {message.text}
        </p>
      )}

      <div className="xl:columns-2 xl:gap-x-6 [&>section]:mb-6 xl:[&>section]:break-inside-avoid">
        <section className="fade-up rounded-2xl border bg-card p-5">
          <p className="font-display text-3xl font-bold tabular-nums">{profile.total_points} pts</p>
          <p className="text-sm text-muted-foreground">
            en {profile.scored_races} {profile.scored_races === 1 ? "carrera puntuada" : "carreras puntuadas"} de la
            temporada {season}
          </p>
        </section>

        <ProfileFavorites userId={profile.user_id} drivers={drivers} teams={teams} />


        <AlbumShowcase userId={profile.user_id} isSelf={profile.relation === "self"} />

        <TrophyShowcase userId={profile.user_id} isSelf={profile.relation === "self"} />

        <BadgeShowcase userId={profile.user_id} isSelf={profile.relation === "self"}/>

        {profile.relation === "friends" && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase">Sus predicciones</h2>
            <p className="text-xs text-muted-foreground">
              Solo se muestran las carreras cuyas predicciones ya cerraron.
            </p>

            {predictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay predicciones para mostrar.</p>
            ) : (
              <div className="space-y-2">
                {predictions.map((prediction) => {
                  const rows = prediction.results ? breakdown(prediction.picks, prediction.results) : null;

                  return (
                    <details key={prediction.round} className="rounded-2xl border bg-card p-4">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
                        <span className="truncate">{prediction.race_name}</span>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {prediction.points !== null ? `${prediction.points} pts` : "Pendiente"}
                        </span>
                      </summary>

                      <ol className="mt-3 space-y-1.5 text-sm">
                        {rows
                          ? rows.map((row) => (
                              <li key={row.position} className="flex items-center gap-2">
                                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                                  {row.position}.º
                                </span>
                                {row.hit ? (
                                  <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Acertó" />
                                ) : (
                                  <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="No acertó" />
                                )}
                                <span className={cn("min-w-0 flex-1 truncate", !row.hit && "text-muted-foreground")}>
                                  {nameOf(row.pick)}
                                </span>
                                <span className="shrink-0 tabular-nums">
                                  {row.points > 0 ? `+${row.points}` : "0"}
                                </span>
                              </li>
                            ))
                          : prediction.picks.map((pick, index) => (
                              <li key={`${pick}-${index}`} className="flex gap-2">
                                <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
                                  {index + 1}.º
                                </span>
                                <span>{nameOf(pick)}</span>
                              </li>
                            ))}
                      </ol>
                    </details>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}