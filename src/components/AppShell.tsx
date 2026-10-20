import { Link, Outlet } from "@tanstack/react-router";
import { CalendarDays, Home, Settings, Trophy } from "lucide-react";
import { Logo } from "@/components/Logo";

export const navItems = [
  { to: "/inicio", label: "Inicio", icon: Home },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/campeonato", label: "Campeonato", icon: Trophy },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function AppShell() {
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
        <div className="mt-auto h-2 rounded-full racing-stripe opacity-40" />
      </aside>

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center border-b bg-background/85 px-4 py-3 backdrop-blur md:hidden">
          <Logo to="/inicio" />
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-sidebar/95 backdrop-blur md:hidden">
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
