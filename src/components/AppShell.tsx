import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { CalendarDays, Home, Image as ImageIcon, LogOut, Settings, Star, Trophy } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { getInitials, useProfile } from "@/hooks/useProfile";

export const navItems = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/campeonato", label: "Campeonato", icon: Trophy },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/fondos", label: "Fondos", icon: ImageIcon },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function AppShell() {
  const { session, loading } = useSession();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Si terminó de cargar y no hay sesión, vuelve al login.
  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [loading, session, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    );
  }

  const shownName = profile.display_name || profile.username || "Tu cuenta";

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar p-5 md:flex">
        <Logo to="/inicio" />
        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "!bg-primary/15 !text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
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
          <div className="h-2 rounded-full racing-stripe opacity-40" />
        </div>
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
          <Logo to="/inicio" />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="rounded-xl p-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t bg-sidebar/95 backdrop-blur md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
