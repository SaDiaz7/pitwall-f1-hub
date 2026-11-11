import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Ellipsis,
  Flag,
  Gauge,
  GraduationCap,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LogIn,
  LogOut,
  Medal,
  Newspaper,
  Puzzle,
  Settings,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { NewsDialog } from "@/components/NewsDialog";
import { NavProgress } from "@/components/NavProgress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { clearPendingInvite, readPendingInvite } from "@/lib/leagues";
import { cn } from "@/lib/utils";

const inicio = { to: "/inicio", label: "Inicio", icon: Home, public: true } as const;

// "public: true" = se puede ver sin iniciar sesión.
export const navGroups = [
  {
    key: "temporada",
    label: "Temporada",
    items: [
      { to: "/calendario", label: "Calendario", icon: CalendarDays, public: true },
      { to: "/campeonato", label: "Campeonato", icon: Trophy, public: true },
      { to: "/analisis", label: "Análisis", icon: Activity, public: true },
      { to: "/guia", label: "Guía de la F1", icon: BookOpen, public: true },
      { to: "/noticias", label: "Noticias", icon: Newspaper, public: true },
      { to: "/colapinto", label: "Zona Colapinto", icon: Sparkles, public: true },
    ],
  },
  {
    key: "juego",
    label: "Juego",
    items: [
      { to: "/predicciones", label: "Predicciones", icon: Target, public: false },
      { to: "/ranking", label: "Ranking", icon: Medal, public: false },
      { to: "/ligas", label: "Ligas", icon: Flag, public: false },
      { to: "/bingo", label: "Bingo Card", icon: LayoutGrid, public: false },
      { to: "/juego", label: "Juego diario", icon: Puzzle, public: true },
      { to: "/quiz", label: "Quiz de F1", icon: GraduationCap, public: true },

    ],
  },
  {
    key: "comunidad",
    label: "Comunidad",
    items: [
      { to: "/amigos", label: "Amigos", icon: Users, public: false },
      { to: "/fondos", label: "Fondos", icon: ImageIcon, public: true },
    ],
  },
  {
    key: "espacio",
    label: "Mi espacio",
    items: [
      { to: "/mi-piloto", label: "Mi piloto", icon: Gauge, public: false },
      { to: "/favoritos", label: "Favoritos", icon: Star, public: false },
      { to: "/ajustes", label: "Ajustes", icon: Settings, public: false },
    ],
  },
] as const;

// Lista plana (la usan el Inicio y otras pantallas).
export const navItems = [
  inicio,
  ...navGroups[0].items,
  ...navGroups[1].items,
  ...navGroups[2].items,
  ...navGroups[3].items,
] as const;

type NavItem = (typeof navItems)[number];

// Páginas que se ven sin cuenta. Las demás redirigen al login.
const PUBLIC_PATHS: string[] = [...navItems.filter((item) => item.public).map((item) => item.to), "/gp"];

// Páginas "hijas" que cuentan como parte de un ítem del menú.
const EXTRA_PREFIXES: Record<string, string[]> = {
  "/calendario": ["/gp"],
  "/campeonato": ["/piloto"],
  "/ligas": ["/liga"],
  "/amigos": ["/usuario"],
};

// Ítems que a un visitante no le sirve ver ni bloqueados.
const GUEST_HIDDEN = new Set<string>(["/ajustes"]);

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isActive(pathname: string, to: string): boolean {
  return [to, ...(EXTRA_PREFIXES[to] ?? [])].some((prefix) => matches(pathname, prefix));
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((prefix) => matches(pathname, prefix));
}

function NavEntry({
  item,
  locked,
  active,
  onNavigate,
}: {
  item: NavItem;
  locked: boolean;
  active: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={locked ? "/login" : item.to}
      onClick={onNavigate}
      title={locked ? "Iniciá sesión para acceder" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{item.label}</span>
      {locked && <Lock className="h-3.5 w-3.5 opacity-60" />}
    </Link>
  );
}

export function AppShell() {
  const { session, loading } = useSession();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigating = useRouterState({ select: (state) => state.isLoading });
  // Cambia recién cuando la página nueva terminó de cargar (así la animación de entrada se ve en el momento justo).
  const pageKey = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location.pathname,
  });

  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [moreOpen, setMoreOpen] = useState(false);

  const guest = !session;
  const publicPath = isPublicPath(pathname);
  // En una página privada, no mostramos el contenido hasta confirmar que hay sesión.
  const blocked = !publicPath && (loading || guest);

  // Sin sesión en una página privada: va al login.
  useEffect(() => {
    if (!loading && !session && !publicPath) {
      navigate({ to: "/login" });
    }
  }, [loading, session, publicPath, navigate]);

  // El menú "Más" del celular se cierra al cambiar de página.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  // Si la persona venía de un link de invitación, la une a la liga apenas entra.
  const inviteHandled = useRef(false);
  useEffect(() => {
    if (loading || !session || inviteHandled.current) return;
    const code = readPendingInvite();
    if (!code) return;

    inviteHandled.current = true;
    clearPendingInvite();

    supabase.rpc("join_league", { p_code: code }).then(({ data }) => {
      const leagueId = data?.[0]?.joined_league_id;
      if (leagueId) navigate({ to: "/liga/$id", params: { id: leagueId } });
      else navigate({ to: "/ligas" });
    });
  }, [loading, session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const shownName = profile.display_name || profile.username || "Tu cuenta";

  const authBox = session ? (
    <div className="space-y-3">
      <div className="flex items-center gap-3 px-3">
        <Avatar className="h-8 w-8">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt="Tu avatar" />}
          <AvatarFallback className="bg-gradient-primary text-xs font-bold text-primary-foreground">
            {getInitials(profile.display_name || profile.username || session.user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{shownName}</p>
          <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </button>
    </div>
  ) : (
    <div className="space-y-2">
      <Link
        to="/login"
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-sidebar-accent"
      >
        <LogIn className="h-4 w-4" /> Iniciar sesión
      </Link>
      <Link
        to="/registro"
        className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold uppercase tracking-wide text-primary-foreground"
      >
        Crear cuenta
      </Link>
    </div>
  );

  const renderGroups = (options: { expandAll: boolean; onNavigate?: (() => void) | undefined }) =>
    navGroups.map((group) => {
      const all: readonly NavItem[] = group.items;
      const items = all.filter((item) => !(guest && GUEST_HIDDEN.has(item.to)));
      if (items.length === 0) return null;

      const hasActive = items.some((item) => isActive(pathname, item.to));
      const expanded = options.expandAll || (open[group.key] ?? hasActive);

      return (
        <div key={group.key} className="mt-2">
          {options.expandAll ? (
            <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              {group.label}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setOpen((current) => ({ ...current, [group.key]: !expanded }))}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground/80 transition-colors hover:text-foreground"
            >
              {group.label}
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
            </button>
          )}

          {expanded && (
            <div className="mt-1 flex flex-col gap-1">
              {items.map((item) => (
                <NavEntry
                  key={item.to}
                  item={item}
                  locked={guest && !item.public}
                  active={isActive(pathname, item.to)}
                  onNavigate={options.onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      );
    });

  // Pestañas fijas de la barra de abajo en el celular.
  const tabPaths = session
    ? ["/inicio", "/calendario", "/predicciones", "/ranking"]
    : ["/inicio", "/calendario", "/campeonato", "/fondos"];
  const tabs = tabPaths
    .map((to) => navItems.find((item) => item.to === to))
    .filter((item): item is NavItem => item !== undefined);

  return (
    <div className="min-h-screen md:flex">
      <NavProgress />
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r bg-sidebar p-5 md:flex">
        <Logo to="/inicio" />
        <nav className="mt-8 flex flex-col gap-1">
          <NavEntry item={inicio} locked={false} active={isActive(pathname, "/inicio")} />
          {renderGroups({ expandAll: false })}
        </nav>
        <div className="mt-auto space-y-3 pt-6">
          {authBox}
          <div className="h-2 rounded-full racing-stripe opacity-40" />
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
          <Logo to="/inicio" />
          {session ? (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="rounded-xl p-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/login" className="rounded-lg px-3 py-1.5 text-sm font-semibold text-primary">
              Ingresar
            </Link>
          )}
        </header>
        <main
          data-navigating={navigating ? "true" : "false"}
          className="nav-dim mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10 2xl:max-w-[1500px]"
        >
          {blocked ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <div key={pageKey} className="page-enter">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-sidebar/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
              isActive(pathname, to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
        >
          <Ellipsis className="h-5 w-5" />
          Más
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] space-y-3 overflow-y-auto rounded-t-2xl border-t bg-sidebar p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <NavEntry
              item={inicio}
              locked={false}
              active={isActive(pathname, "/inicio")}
              onNavigate={() => setMoreOpen(false)}
            />
            {renderGroups({ expandAll: true, onNavigate: () => setMoreOpen(false) })}
            <div className="pt-3">{authBox}</div>
          </div>
        </div>
      )}

      {session && <NewsDialog />}
    </div>
  );
}