import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { TrophyArt, trophyName } from "@/components/trophies/TrophyArt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { MIN_MEMBERS, extractInviteCode, friendlyError } from "@/lib/leagues";
import { cn } from "@/lib/utils";

interface MyLeague {
  league_id: string;
  name: string;
  member_count: number;
  is_owner: boolean;
  active: boolean;
  invite_code: string;
}

type Message = { type: "ok" | "error"; text: string } | null;

const JOIN_MESSAGES: Record<string, string> = {
  not_found: "No encontramos ninguna liga con ese código.",
  limit: "Ya estás en 10 ligas, que es el máximo.",
  full: "Esa liga ya llegó al máximo de 50 miembros.",
};

export function LeaguesPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const userId = session?.user.id;
  const season = new Date().getFullYear();

  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_leagues");
    if (error) {
      console.error("Cargar ligas:", error);
      setMessage({ type: "error", text: "No pudimos cargar tus ligas." });
    } else {
      setLeagues(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionLoading || !userId) return;
    load();
  }, [sessionLoading, userId, load]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setBusy(true);

    const { data, error } = await supabase.rpc("create_league", { p_name: name });
    setBusy(false);

    if (error) {
      console.error("Crear liga:", error);
      setMessage({ type: "error", text: friendlyError(error, "No pudimos crear la liga.") });
      return;
    }
    if (data) await navigate({ to: "/liga/$id", params: { id: data } });
  };

  const onJoin = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    const clean = extractInviteCode(code);
    if (!clean) {
      setMessage({ type: "error", text: "Pegá el código o el link de invitación." });
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.rpc("join_league", { p_code: clean });
    setBusy(false);

    const row = data?.[0];
    if (error || !row) {
      if (error) console.error("Unirse a la liga:", error);
      setMessage({
        type: "error",
        text: error ? friendlyError(error, "No pudimos unirte a la liga.") : "No pudimos unirte a la liga.",
      });
      return;
    }

    if (row.joined_league_id) {
      await navigate({ to: "/liga/$id", params: { id: row.joined_league_id } });
      return;
    }
    setMessage({ type: "error", text: JOIN_MESSAGES[row.join_status] ?? "No pudimos unirte a la liga." });
  };

  return (
    <>
      <PageHeader title="Ligas" subtitle="Competí con tus amigos y ganá el trofeo de la temporada. El trofeo se entrega al final de cada temporada y cambia visualmente para cada año. Intenta coleccionar los que más puedas!" />

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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <form onSubmit={onCreate} className="fade-up space-y-3 rounded-2xl border bg-card p-5">
            <h2 className="text-xl font-bold uppercase">Crear una liga</h2>
            <p className="text-sm text-muted-foreground">
              Con {MIN_MEMBERS} personas la liga arranca y compite por el trofeo de la temporada.
            </p>
            <Input
              value={name}
              maxLength={30}
              placeholder="Ej.: Los pibes del asado"
              aria-label="Nombre de la liga"
              onChange={(e) => setName(e.target.value)}
              className="h-11"
            />
            <Button
              type="submit"
              disabled={busy || name.trim().length < 3}
              className="bg-gradient-primary font-semibold transition-transform active:scale-95"
            >
              Crear liga
            </Button>
          </form>

          <form
            onSubmit={onJoin}
            className="fade-up space-y-3 rounded-2xl border bg-card p-5"
            style={{ "--i": 1 } as CSSProperties}
          >
            <h2 className="text-xl font-bold uppercase">Unirme con un código</h2>
            <p className="text-sm text-muted-foreground">Pegá el código o el link que te pasaron.</p>
            <Input
              value={code}
              placeholder="Código o link de invitación"
              aria-label="Código de invitación"
              onChange={(e) => setCode(e.target.value)}
              className="h-11"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={busy || code.trim().length === 0}
              className="transition-transform active:scale-95"
            >
              Unirme
            </Button>
          </form>
        </div>

        <div className="min-w-0 space-y-6">
          <section className="space-y-3">
            <h2 className="text-xl font-bold uppercase">Mis ligas</h2>

            {loading ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3">
                <div className="skeleton h-24" />
                <div className="skeleton h-24" />
              </div>
            ) : leagues.length === 0 ? (
              <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
                Todavía no estás en ninguna liga. Creá una o unite con un código de invitación.
              </div>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3">
                {leagues.map((league, index) => (
                  <li
                    key={league.league_id}
                    className="fade-up"
                    style={{ "--i": Math.min(index, 8) } as CSSProperties}
                  >
                    <Link
                      to="/liga/$id"
                      params={{ id: league.league_id }}
                      className="card-link block h-full rounded-2xl border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate font-display text-xl font-bold uppercase">{league.name}</p>
                        {league.is_owner && (
                          <Crown className="h-4 w-4 shrink-0 text-primary" aria-label="Creaste esta liga" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {league.member_count} {league.member_count === 1 ? "miembro" : "miembros"}
                      </p>
                      <p className={cn("mt-2 text-xs font-semibold", league.active ? "text-success" : "text-primary")}>
                        {league.active
                          ? "Activa"
                          : `En formación · faltan ${Math.max(0, MIN_MEMBERS - league.member_count)}`}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="fade-up flex items-center gap-4 rounded-2xl border bg-card p-4 sm:max-w-md"
            style={{ "--i": 2 } as CSSProperties}
          >
            <TrophyArt year={season} className="w-20 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                En juego esta temporada
              </p>
              <p className="font-display text-xl font-bold uppercase">{trophyName(season)}</p>
              <p className="text-sm text-muted-foreground">
                Quien termine primero la temporada {season} en su liga se queda con la copa.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}