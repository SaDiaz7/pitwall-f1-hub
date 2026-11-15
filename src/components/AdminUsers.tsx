import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { RefreshCw } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { cn } from "@/lib/utils";

type UserStats = {
  total: number;
  today: number;
  last_7: number;
  last_30: number;
  complete: number;
  providers: { provider: string; count: number }[];
  countries: { country: string; count: number }[];
  daily: { day: string; count: number }[];
};

type RecentUser = {
  id: string;
  username: string | null;
  display_name: string | null;
  country: string | null;
  avatar_url: string | null;
  provider: string;
  created_at: string;
  last_sign_in_at: string | null;
  complete: boolean;
};

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

function relative(iso: string | null): string {
  if (!iso) return "nunca";
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, "minute");
  if (abs < 60 * 24) return rtf.format(Math.round(diffMin / 60), "hour");
  return rtf.format(Math.round(diffMin / (60 * 24)), "day");
}

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email";
  return provider;
}

function countryName(code: string): string {
  return COUNTRY_OPTIONS.find((option) => option.code === code)?.name ?? code;
}

function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

export function AdminUsers() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [statsRes, usersRes] = await Promise.all([
      supabase.rpc("admin_user_stats"),
      supabase.rpc("admin_recent_users", { p_limit: 24 }),
    ]);

    if (statsRes.error || usersRes.error) {
      console.error("Panel de usuarios:", statsRes.error ?? usersRes.error);
      setError("No pudimos cargar los datos. Revisá la consola para ver el detalle.");
      setLoading(false);
      return;
    }

    setStats(statsRes.data as unknown as UserStats);
    setUsers((usersRes.data ?? []) as unknown as RecentUser[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDaily = stats ? Math.max(1, ...stats.daily.map((item) => item.count)) : 1;
  const maxCountry = stats ? Math.max(1, ...stats.countries.map((item) => item.count)) : 1;

  const summary = stats
    ? [
        { label: "Usuarios", value: String(stats.total) },
        { label: "Hoy", value: String(stats.today) },
        { label: "Últimos 7 días", value: String(stats.last_7) },
        { label: "Últimos 30 días", value: String(stats.last_30) },
        { label: "Perfil completo", value: `${stats.complete}/${stats.total}` },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold uppercase">Usuarios</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registros nuevos, países y perfiles completos. El día corta a medianoche de Argentina.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
          className="transition-transform active:scale-95"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

      {loading && !stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
          <div className="skeleton h-40 w-full" />
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {summary.map((item, index) => (
              <div key={item.label} className="fade-up rounded-xl border bg-card p-4" style={stagger(index)}>
                <p className="font-display text-3xl font-bold leading-none tabular-nums">{item.value}</p>
                <p className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(5)}>
              <h3 className="text-sm font-bold uppercase tracking-wider">Registros por día (14 días)</h3>
              <div className="mt-4 flex h-28 items-end gap-1">
                {stats.daily.map((item, index) => (
                  <div
                    key={item.day}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                    title={`${item.day.slice(8)}/${item.day.slice(5, 7)}: ${item.count}`}
                  >
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {item.count > 0 ? item.count : ""}
                    </span>
                    <div
                      className="fade-up w-full rounded-t bg-primary/80"
                      style={{
                        ...stagger(index),
                        height: `${Math.max(4, (item.count / maxDaily) * 100)}%`,
                        opacity: item.count > 0 ? 1 : 0.25,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1">
                {stats.daily.map((item) => (
                  <span key={item.day} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
                    {item.day.slice(8)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Cómo se registran:{" "}
                {stats.providers.map((p) => `${providerLabel(p.provider)} ${p.count}`).join(" · ") || "—"}
              </p>
            </section>

            <section className="fade-up rounded-2xl border bg-card p-4" style={stagger(6)}>
              <h3 className="text-sm font-bold uppercase tracking-wider">Países</h3>
              {stats.countries.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Todavía no hay nacionalidades cargadas.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {stats.countries.map((item, index) => (
                    <li key={item.country} className="fade-up flex items-center gap-2" style={stagger(index)}>
                      <CountryFlag code={item.country} className="h-4 shrink-0" />
                      <span className="w-28 shrink-0 truncate text-sm">{countryName(item.country)}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.count / maxCountry) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-sm font-semibold tabular-nums">{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider">Últimos registros</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="fade-up flex items-center gap-3 rounded-xl border bg-card p-3"
                  style={stagger(index)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
                    <AvatarFallback className="bg-gradient-primary font-display text-primary-foreground">
                      {getInitials(user.display_name || user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {user.country && <CountryFlag code={user.country} className="h-3.5 shrink-0" />}
                      <span className="truncate">{user.display_name || user.username || "Sin nombre"}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.username ? `@${user.username}` : "sin usuario"} · {providerLabel(user.provider)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Se unió {relative(user.created_at)} · activo {relative(user.last_sign_in_at)}
                    </p>
                  </div>
                  {!user.complete && (
                    <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                      Incompleto
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}