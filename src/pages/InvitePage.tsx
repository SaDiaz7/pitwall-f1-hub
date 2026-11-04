import { useEffect, useState } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { GoogleIcon } from "@/components/AuthForm";
import { Logo } from "@/components/Logo";
import { TrophyArt } from "@/components/trophies/TrophyArt";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { MIN_MEMBERS, friendlyError, savePendingInvite } from "@/lib/leagues";

const route = getRouteApi("/invitacion/$code");

interface Invite {
  league_name: string;
  member_count: number;
  owner_name: string | null;
}

const JOIN_ERRORS: Record<string, string> = {
  limit: "Ya estás en 10 ligas, que es el máximo.",
  full: "Esa liga ya está completa.",
};

export function InvitePage() {
  const { code } = route.useParams();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.rpc("get_league_invite", { p_code: code }).then(({ data, error: rpcError }) => {
      if (cancelled) return;
      if (rpcError) console.error("Cargar invitación:", rpcError);
      setInvite(rpcError ? null : (data?.[0] ?? null));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [code]);

  // Si todavía no tiene cuenta, guardamos el código para unirlo apenas entre.
  useEffect(() => {
    if (!sessionLoading && !session && invite) savePendingInvite(code.toLowerCase());
  }, [sessionLoading, session, invite, code]);

  const join = async () => {
    setError(null);
    setJoining(true);
    const { data, error: rpcError } = await supabase.rpc("join_league", { p_code: code });
    setJoining(false);

    const row = data?.[0];
    if (rpcError || !row) {
      setError(rpcError ? friendlyError(rpcError, "No pudimos unirte a la liga.") : "No pudimos unirte a la liga.");
      return;
    }
    if (row.joined_league_id) {
      await navigate({ to: "/liga/$id", params: { id: row.joined_league_id } });
      return;
    }
    setError(JOIN_ERRORS[row.join_status] ?? "Este link ya no es válido.");
  };

  const continueWithGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    savePendingInvite(code.toLowerCase());

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/inicio` },
    });

    if (oauthError) {
      console.error("Login con Google:", oauthError);
      setError("No pudimos conectar con Google. Probá de nuevo en un momento.");
      setGoogleLoading(false);
    }
  };

  const loggedIn = !sessionLoading && Boolean(session);
  const missing = invite ? Math.max(0, MIN_MEMBERS - invite.member_count) : 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-6 text-center shadow-glow">
          {loading ? (
            <p className="text-sm text-muted-foreground">Buscando la liga…</p>
          ) : !invite ? (
            <>
              <h1 className="text-2xl font-bold uppercase italic">Link no válido</h1>
              <p className="text-sm text-muted-foreground">
                Este link de invitación no existe o la liga ya no está disponible.
              </p>
              <Link to="/" className="inline-block text-sm font-semibold text-primary hover:underline">
                Ir al inicio
              </Link>
            </>
          ) : (
            <>
              <TrophyArt year={new Date().getFullYear()} className="mx-auto w-32" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Te invitaron a una liga</p>
                <h1 className="mt-1 text-3xl font-bold uppercase italic">{invite.league_name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {invite.owner_name ? `${invite.owner_name} te invitó · ` : ""}
                  {invite.member_count} {invite.member_count === 1 ? "miembro" : "miembros"}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {missing > 0
                  ? `Con ${missing} ${missing === 1 ? "persona" : "personas"} más la liga arranca y compite por el trofeo de la temporada.`
                  : "Competí con ellos por el trofeo de la temporada."}
              </p>

              {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

              {loggedIn ? (
                <Button
                  type="button"
                  disabled={joining}
                  onClick={join}
                  className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide"
                >
                  {joining ? "Uniéndote…" : "Unirme a la liga"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading}
                    onClick={continueWithGoogle}
                    className="h-11 w-full gap-3 font-semibold"
                  >
                    <GoogleIcon />
                    {googleLoading ? "Conectando…" : "Continuar con Google"}
                  </Button>
                  <Link
                    to="/registro"
                    className="flex h-11 w-full items-center justify-center rounded-md bg-gradient-primary font-semibold uppercase tracking-wide text-primary-foreground"
                  >
                    Crear cuenta con email
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tenés cuenta?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:underline">
                      Iniciar sesión
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sin spam y sin compartir tus datos. Podés eliminar tu cuenta cuando quieras.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}