import { useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { timeAgo } from "@/components/HomeNews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLeagueWall } from "@/hooks/useLeagueWall";
import { useNow } from "@/hooks/useNow";
import { getInitials } from "@/hooks/useProfile";
import { WALL_EMOJIS, WALL_MAX } from "@/lib/league-wall";
import { cn } from "@/lib/utils";

const STARTERS = [
  "¿Quién la tiene clara para el domingo?",
  "Esta semana me siento campeón 🏆",
  "¡Qué carrera la de ayer!",
];

export function LeagueWall({ leagueId, userId }: { leagueId: string; userId: string }) {
  const { posts, loading, hasMore, error, loadMore, post, remove, react } = useLeagueWall(leagueId);
  const now = useNow(30_000);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setMessage(null);
    const result = await post(body);
    setSending(false);

    if (result.ok) setText("");
    else setMessage(result.message);
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    void submit();
  };

  const onKeyDown = (ev: KeyboardEvent<HTMLTextAreaElement>) => {
    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      void submit();
    }
  };

  const onLoadMore = async () => {
    setLoadingMore(true);
    await loadMore();
    setLoadingMore(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="fade-up space-y-2 rounded-2xl border bg-card p-4">
        <Textarea
          value={text}
          rows={2}
          maxLength={WALL_MAX}
          placeholder="Escribile algo a la liga…"
          aria-label="Mensaje para la liga"
          onChange={(e) => {
            setText(e.target.value);
            setMessage(null);
          }}
          onKeyDown={onKeyDown}
        />
        {message && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{message}</p>}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-muted-foreground">
            {text.length}/{WALL_MAX}
          </span>
          <Button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-gradient-primary font-semibold transition-transform active:scale-95"
          >
            {sending ? "Publicando…" : "Publicar"}
          </Button>
        </div>
      </form>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : posts.length === 0 ? (
        <div className="space-y-3 rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Todavía no hay mensajes. ¡Rompé el hielo!</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                key={starter}
                type="button"
                onClick={() => setText(starter)}
                className="rounded-full border bg-secondary/40 px-3 py-1 text-sm transition hover:bg-secondary active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((item, index) => {
            const name = item.display_name || item.username || "Sin nombre";
            const mine = item.user_id === userId;

            return (
              <li
                key={item.post_id}
                className="fade-up rounded-2xl border bg-card p-4"
                style={{ "--i": Math.min(index, 8) } as CSSProperties}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    {item.avatar_url && <AvatarImage src={item.avatar_url} alt="" />}
                    <AvatarFallback className="bg-secondary text-xs font-bold">{getInitials(name)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <Link
                        to="/usuario/$id"
                        params={{ id: item.user_id }}
                        className="truncate font-semibold hover:underline"
                      >
                        {name}
                      </Link>
                      {mine && <span className="text-xs text-primary">(vos)</span>}
                      <span className="text-xs text-muted-foreground">{timeAgo(item.created_at, now)}</span>
                    </div>

                    <p className="mt-1 whitespace-pre-line break-words text-sm">{item.body}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {WALL_EMOJIS.map((emoji) => {
                        const reaction = item.reactions[emoji];
                        const count = reaction?.count ?? 0;
                        const reacted = reaction?.mine ?? false;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => void react(item.post_id, emoji)}
                            aria-pressed={reacted}
                            aria-label={`Reaccionar con ${emoji}`}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100",
                              reacted ? "border-primary/60 bg-primary/15" : "bg-secondary/40 hover:bg-secondary",
                              count === 0 && !reacted && "opacity-50 hover:opacity-100",
                            )}
                          >
                            {emoji}
                            {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {item.can_delete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("¿Borrar este mensaje?")) void remove(item.post_id);
                      }}
                      aria-label="Borrar mensaje"
                      className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:text-destructive active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-lg border px-5 py-2 text-sm font-semibold transition hover:bg-accent/40 active:scale-95 disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {loadingMore ? "Cargando…" : "Ver mensajes anteriores"}
          </button>
        </div>
      )}
    </div>
  );
}