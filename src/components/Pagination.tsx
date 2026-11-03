import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// Devuelve algo como: 1 … 4 5 6 … 10
function getPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const list: (number | "…")[] = [];
  pages.forEach((p, i) => {
    const prev = pages[i - 1];
    if (prev !== undefined && p - prev === 2) list.push(prev + 1);
    else if (prev !== undefined && p - prev > 2) list.push("…");
    list.push(p);
  });
  return list;
}

const BUTTON_CLASS =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={cn(BUTTON_CLASS, "hover:bg-accent")}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {getPageList(page, totalPages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              BUTTON_CLASS,
              item === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={cn(BUTTON_CLASS, "hover:bg-accent")}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}