import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { TrophyArt, trophyName } from "@/components/trophies/TrophyArt";
import { AnimatedBar } from "@/components/AnimatedBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { computeRanks } from "@/hooks/useLeaderboards";
import { getInitials } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, inviteUrl } from "@/lib/leagues";
import { cn } from "@/lib/utils";

const route = getRouteApi("/_privado/liga/$id");

interface LeagueInfo {
  league_id: string;
  name: string;
  member_count: number;
  min_members: number;
  is_owner: boolean;
  active: boolean;
  invite_code: string;
}

interface Member {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number | null;
  scored_races: number | null;
}

function MemberAvatar({ member }: { member: Member }) {
  const name = member.display_name || member.username || "Sin nombre";
  return (
    <Avatar className="h-10 w-10">
      {member.avatar_url && <AvatarImage src={member.avatar_url} alt="" />}
      <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

export function LeaguePage() {
  const { id } = route.useParams();
  const season = new Date().getFullYear();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;

  const [info, setInfo] = useState<LeagueInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const infoResult = await supabase.rpc("get_league_info", { p_league_id: id });
    const row = infoResult.error ? null : (infoResult.data?.[0] ?? null);
    if (infoResult.error) console.error("Cargar liga:", infoResult.error);
    setInfo(row);

    if (row) {
      const board = await supabase.rpc("get_league_leaderboard", { p_league_id: id, p_season: season });
      if (board.error) console.error("Cargar tabla de la liga:", board.error);
      setMembers(board.error ? [] : (board.data ?? []));
    }
    setLoading(false);
  }, [id, season]);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    load();
  }, [sessionLoading, userId, load]);

  const back = (
    <Link
      to="/ligas"
      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Volver a ligas
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <p className="text-sm text-muted-foreground">Cargando la liga…</p>
      </>
    );
  }

  if (!info) {
    return (
      <>
        {back}
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          Esta liga no está disponible: puede que no seas parte de ella o que ya no exista.
        </div>
      </>
    );
  }

  const link = inviteUrl(info.invite_code);
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Sumate a mi liga "${info.name}" en PitWall: ${link}`)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el link de invitación:", link);
    }
  };

  const leave = async () => {
    if (!window.confirm("¿Salir de esta liga?")) return;
    setError(null);
    const { error: rpcError } = await supabase.rpc("leave_league", { p_league_id: id });
    if (rpcError) {
      console.error("Salir de la liga:", rpcError);
      setError(friendlyError(rpcError, "No pudimos sacarte de la liga."));
      return;
    }
    await navigate({ to: "/ligas" });
  };

  const ranked = members.map((m) => ({
    ...m,
    total_points: m.total_points ?? 0,
    scored_races: m.scored_races ?? 0,
  }));
  const ranks = computeRanks(ranked);
  const missing = Math.max(0, info.min_members - info.member_count);

  return (
    <>
      {back}

      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold uppercase leading-tight">{info.name}</h1>
        <p className="text-sm text-muted-foreground">
          {info.member_count} {info.member_count === 1 ? "miembro" : "miembros"} · temporada {season}
        </p>
      </header>

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="fade-up flex items-center gap-4 rounded-2xl border bg-card p-4">
            <TrophyArt year={season} className="w-24 shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-xl font-bold uppercase">En juego: {trophyName(season)}</p>
              <p className="text-sm text-muted-foreground">
                Quien termine primero la temporada {season} se queda con la copa en su vitrina. Si hay empate, la
                comparten.
              </p>
            </div>
          </section>

          <section
            className="fade-up space-y-3 rounded-2xl border bg-card p-5"
            style={{ "--i": 1 } as CSSProperties}
          >
            <h2 className="text-xl font-bold uppercase">Invitá a tus amigos</h2>
            <p className="text-sm text-muted-foreground">
              Cualquier miembro puede compartir el link. Quien lo abra se registra (o entra) y queda dentro de la liga.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md bg-secondary px-3 py-2 text-xs">{link}</code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLink}
                className="transition-transform active:scale-95"
              >
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-md bg-gradient-primary px-3 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
              >
                Compartir por WhatsApp
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              O pasales el código: <span className="font-mono font-semibold">{info.invite_code}</span>
            </p>
          </section>

          <div>
            <Button type="button" variant="outline" size="sm" onClick={leave} className="transition-transform active:scale-95">
              Salir de la liga
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          {!info.active ? (
            <section className="fade-up space-y-4 rounded-2xl border bg-card p-5">
              <div>
                <h2 className="text-xl font-bold uppercase">Liga en formación</h2>
                <p className="text-sm text-muted-foreground">
                  Faltan {missing} {missing === 1 ? "persona" : "personas"} para que la liga arranque. Hasta entonces
                  la tabla de posiciones está oculta.
                </p>
              </div>
              <AnimatedBar percent={Math.min(100, (info.member_count / info.min_members) * 100)} className="h-2" />
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3">
                {members.map((member) => (
                  <li key={member.user_id} className="flex items-center gap-3">
                    <MemberAvatar member={member} />
                    <span className="min-w-0 truncate font-semibold">
                      {member.display_name || member.username || "Sin nombre"}
                      {member.user_id === userId && (
                        <span className="ml-2 text-xs font-normal text-primary">(vos)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section className="space-y-3">
              <h2 className="text-xl font-bold uppercase">Tabla de posiciones</h2>
              <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))] gap-2">
                {ranked.map((member, index) => {
                  const mine = member.user_id === userId;
                  const name = member.display_name || member.username || "Sin nombre";
                  return (
                    <li
                      key={member.user_id}
                      className={cn(
                        "fade-up flex items-center gap-3 rounded-2xl border bg-card p-3",
                        mine && "border-primary/60",
                      )}
                      style={{ "--i": Math.min(index, 10) } as CSSProperties}
                    >
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-base font-bold",
                          ranks[index] === 1 ? "bg-gradient-primary text-primary-foreground" : "bg-secondary",
                        )}
                      >
                        {ranks[index]}
                      </span>
                      <MemberAvatar member={member} />
                      <p className="min-w-0 flex-1 truncate font-semibold">
                        {name}
                        {mine && <span className="ml-2 text-xs font-normal text-primary">(vos)</span>}
                      </p>
                      <div className="text-right">
                        <p className="font-display text-xl font-bold tabular-nums">{member.total_points}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.scored_races} {member.scored_races === 1 ? "carrera" : "carreras"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </>
  );
}