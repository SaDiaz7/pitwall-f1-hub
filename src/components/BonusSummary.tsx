import { Check, X } from "lucide-react";
import {
  bonusBreakdown,
  describeBonusValue,
  type BonusAnswers,
} from "@/lib/predictions";
import { cn } from "@/lib/utils";

export function BonusSummary({
  answers,
  results,
  nameOf,
}: {
  answers: BonusAnswers;
  // null mientras la carrera no se calculó.
  results: BonusAnswers | null;
  nameOf: (id: string | null) => string;
}) {
  const rows = bonusBreakdown(answers, results);
  const answered = rows.filter((row) => row.answer !== null);

  // Nada que mostrar si no contestó ninguna extra y todavía no hay resultados.
  if (answered.length === 0 && results === null) return null;

  return (
    <div className="space-y-1.5 border-t pt-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Extras</p>
      <ul className="space-y-1.5 text-sm">
        {rows.map((row) => {
          const showResult = results !== null && row.result !== null;
          return (
            <li key={row.question.key} className="flex items-center gap-2">
              {showResult &&
                (row.hit ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-label="Acertaste" />
                ) : (
                  <X className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="No acertaste" />
                ))}
              <span className="min-w-0 flex-1">
                <span className={cn("text-muted-foreground", !showResult && "text-foreground/70")}>
                  {row.question.label}
                </span>{" "}
                <span className={cn("font-semibold", showResult && !row.hit && "text-muted-foreground")}>
                  {describeBonusValue(row.question, row.answer, nameOf)}
                </span>
                {showResult && !row.hit && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · fue {describeBonusValue(row.question, row.result, nameOf)}
                  </span>
                )}
              </span>
              {showResult && (
                <span className="shrink-0 tabular-nums">{row.points > 0 ? `+${row.points}` : "0"}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}