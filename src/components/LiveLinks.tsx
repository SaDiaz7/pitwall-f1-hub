import { ExternalLink, Gauge, Globe, Tv } from "lucide-react";
import { LIVE_LINKS } from "@/lib/live-links";
import { cn } from "@/lib/utils";

const ICONS = { dash: Gauge, stream: Tv, f1: Globe } as const;

export function LiveLinks({ className }: { className?: string | undefined }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {LIVE_LINKS.map((link) => {
        const Icon = ICONS[link.key];
        return (
          <a
            key={link.key}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            title={link.hint}
            className="inline-flex items-center gap-2 rounded-lg border bg-background/40 px-3 py-1.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:bg-accent/40 active:scale-95"
          >
            <Icon className="h-4 w-4 text-primary" />
            {link.label}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}