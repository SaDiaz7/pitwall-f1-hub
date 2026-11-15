import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { RefreshCw, Search, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type WallPost = {
  post_id: string;
  league_id: string;
  league_name: string | null;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  body: string;
  created_at: string;
  reactions: number;
};

const PAGE = 40;
const MAX = 100;

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

function relative(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, "minute");
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), "hour");
  return rtf.format(Math.round(diffMin / (60 * 24)), "day");
}

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export function AdminWalls() {
  const [posts, setPosts] = useState<WallPost[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (nextLimit: number, search: string) => {
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("admin_league_posts", {
      p_limit: nextLimit,
      p_search: search,
    });

    if (rpcError) {
      console.error("Moderación de muros:", rpcError);
      setError("No pudimos cargar los mensajes. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setPosts((data ?? []) as unknown as WallPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(PAGE, "");
  }, [load]);

  const onSearch = (ev: FormEvent) => {
    ev.preventDefault();
    const clean = query.trim();
    setApplied(clean);
    setLimit(PAGE);
    void load(PAGE, clean);
  };

  const onMore = () => {
    const next = Math.min(MAX, limit + PAGE);
    setLimit(next);
    void load(next, applied);
  };

  const onDelete = async (post: WallPost) => {
    const who = post.display_name || post.username || "este usuario";
    if (!window.confirm(`¿Borrar el mensaje de ${who}? No se puede deshacer.`)) return;

    setDeletingId(post.post_id);
    setError(null);
    const { error: rpcError } = await supabase.rpc("admin_delete_league_post", { p_post_id: post.post_id });
    setDeletingId(null);

    if (rpcError) {
      console.error("Borrar mensaje:", rpcError);
      setError("No pudimos borrar el mensaje. Revisá la consola para ver el detalle.");
      return;
    }

    setPosts((prev) => prev.filter((item) => item.post_id !== post.post_id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Muros de las ligas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Los mensajes más recientes de todas las ligas. Podés buscar por texto, usuario o nombre de liga.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load(limit, applied)}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <form onSubmit={onSearch} className="flex max-w-md gap-2">
        <Input
          value={query}
          placeholder="Buscar mensaje, usuario o liga…"
          onChange={(ev) => setQuery(ev.target.value)}
        />
        <Button type="submit" variant="outline" className="shrink-0 transition-transform active:scale-95">
          <Search className="h-4 w-4" />
          <span className="sr-only">Buscar</span>
        </Button>
      </form>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading && posts.length === 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">
          {applied ? "No hay mensajes que coincidan con la búsqueda." : "Todavía no hay mensajes en ningún muro."}
        </p>
      )}

      {posts.length > 0 && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {posts.map((post, index) => (
              <div
                key={post.post_id}
                className="fade-up flex flex-col gap-3 rounded-xl border bg-card p-3"
                style={stagger(index)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    {post.avatar_url && <AvatarImage src={post.avatar_url} alt="" />}
                    <AvatarFallback className="bg-gradient-primary font-display text-primary-foreground">
                      {getInitials(post.display_name || post.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {post.display_name || post.username || "Sin nombre"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {post.username ? `@${post.username} · ` : ""}
                      {relative(post.created_at)}
                    </p>
                  </div>
                </div>

                <p className="whitespace-pre-wrap break-words text-sm">{post.body}</p>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {post.league_name ?? "Liga borrada"}
                    </span>
                    {post.reactions > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">{post.reactions} reacc.</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deletingId === post.post_id}
                    onClick={() => void onDelete(post)}
                    className="shrink-0 text-destructive transition-transform active:scale-95"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    {deletingId === post.post_id ? "Borrando…" : "Borrar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {posts.length >= limit && limit < MAX && (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={onMore}
              className="transition-transform active:scale-95"
            >
              {loading ? "Cargando…" : "Ver más"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}