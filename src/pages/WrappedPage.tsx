import { PageHeader } from "@/components/PageHeader";
import { WrappedStories } from "@/components/WrappedStories";
import { useWrapped } from "@/hooks/useWrapped";
import { SEASON_END } from "@/lib/wrapped";

export function WrappedPage() {
  const { data, badgeStats, loading, error } = useWrapped();
  const isFinal = Date.now() >= SEASON_END;

  return (
    <>
      <PageHeader
        title="Mi temporada"
        subtitle={
          isFinal
            ? "Tu año completo en PitWall."
            : "Tu año en PitWall hasta la última carrera disputada. Se actualiza solo."
        }
      />

      {loading ? (
        <div className="skeleton h-[min(72dvh,42rem)] w-full max-w-sm" />
      ) : error || !data ? (
        <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">
          {error ?? "No pudimos armar tu resumen."}
        </p>
      ) : (
        <WrappedStories data={data} badgeStats={badgeStats} isFinal={isFinal} />
      )}
    </>
  );
}