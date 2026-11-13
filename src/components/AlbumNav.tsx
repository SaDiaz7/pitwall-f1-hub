import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/album", label: "Colección" },
  { to: "/repetidas", label: "Repetidas" },
] as const;

// Menú chico para ir y volver entre el álbum y las repetidas.
export function AlbumNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="mb-5 flex gap-2" aria-label="Álbum">
      {ITEMS.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              active ? "border-primary/60 bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}