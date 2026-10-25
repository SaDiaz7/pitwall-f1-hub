import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFriends, type FriendResult, type FriendRow } from "@/hooks/useFriends";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Message = { type: "ok" | "error"; text: string } | null;

function Person({ person, children }: { person: FriendRow; children?: ReactNode }) {
  const name = person.display_name || person.username || "Sin nombre";

  return (
    <li className="flex items-center gap-3 rounded-2xl border bg-card p-3">
      <Link to="/usuario/$id" params={{ id: person.user_id }} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10">
          {person.avatar_url && <AvatarImage src={person.avatar_url} alt="" />}
          <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{name}</span>
          {person.username && <span className="block truncate text-xs text-muted-foreground">@{person.username}</span>}
        </span>
      </Link>
      <div className="flex shrink-0 gap-2">{children}</div>
    </li>
  );
}

export function FriendsPage() {
  const { rows, loading, error, sendRequest, respond, remove } = useFriends();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [message, setMessage] = useState<Message>(null);

  // Busca mientras se escribe (con una pequeña espera para no consultar en cada letra).
  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = window.setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc("search_profiles", { p_query: text });
      if (cancelled) return;

      setSearching(false);
      if (rpcError) {
        console.error("Buscar perfiles:", rpcError);
        setMessage({ type: "error", text: "No pudimos buscar en este momento." });
        setResults([]);
        return;
      }
      setResults(data ?? []);
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, refresh]);

  const run = async (action: () => Promise<FriendResult>) => {
    setMessage(null);
    const result = await action();
    setMessage({ type: result.ok ? "ok" : "error", text: result.message });
    setRefresh((n) => n + 1);
  };

  const friends = rows.filter((r) => r.relation === "friends");
  const received = rows.filter((r) => r.relation === "received");
  const sent = rows.filter((r) => r.relation === "sent");

  return (
    <>
      <PageHeader title="Amigos" subtitle="Buscá a otros fans y comparen sus predicciones." />

      {error && <p className="mb-4 rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}
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

      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-bold uppercase">Buscar personas</h2>
          <Input
            value={query}
            placeholder="Nombre de usuario o nombre visible"
            aria-label="Buscar personas"
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 max-w-md"
          />

          {query.trim().length >= 2 && (
            <>
              {searching && <p className="text-sm text-muted-foreground">Buscando…</p>}
              {!searching && results.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No encontramos a nadie. Solo aparecen quienes eligieron un nombre de usuario y tienen la visibilidad
                  activada.
                </p>
              )}
              {results.length > 0 && (
                <ul className="space-y-2">
                  {results.map((person) => (
                    <Person key={person.user_id} person={person}>
                      {person.relation === "none" && (
                        <Button type="button" size="sm" onClick={() => run(() => sendRequest(person.user_id))}>
                          Agregar
                        </Button>
                      )}
                      {person.relation === "pending_sent" && (
                        <span className="text-xs text-muted-foreground">Pedido enviado</span>
                      )}
                      {person.relation === "pending_received" && (
                        <Button type="button" size="sm" onClick={() => run(() => respond(person.user_id, true))}>
                          Aceptar
                        </Button>
                      )}
                      {person.relation === "friends" && (
                        <span className="text-xs font-semibold text-primary">Amigos</span>
                      )}
                    </Person>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando tus amigos…</p>
        ) : (
          <>
            {received.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold uppercase">Pedidos recibidos</h2>
                <ul className="space-y-2">
                  {received.map((person) => (
                    <Person key={person.user_id} person={person}>
                      <Button type="button" size="sm" onClick={() => run(() => respond(person.user_id, true))}>
                        Aceptar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => run(() => respond(person.user_id, false))}
                      >
                        Rechazar
                      </Button>
                    </Person>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-3">
              <h2 className="text-xl font-bold uppercase">Mis amigos</h2>
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no tenés amigos. Buscá a alguien arriba.</p>
              ) : (
                <ul className="space-y-2">
                  {friends.map((person) => (
                    <Person key={person.user_id} person={person}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (window.confirm("¿Quitar a esta persona de tus amigos?")) {
                            void run(() => remove(person.user_id));
                          }
                        }}
                      >
                        Quitar
                      </Button>
                    </Person>
                  ))}
                </ul>
              )}
            </section>

            {sent.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold uppercase">Pedidos enviados</h2>
                <ul className="space-y-2">
                  {sent.map((person) => (
                    <Person key={person.user_id} person={person}>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => run(() => remove(person.user_id))}
                      >
                        Cancelar
                      </Button>
                    </Person>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}