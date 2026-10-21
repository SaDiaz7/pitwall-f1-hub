import { useEffect, useState } from "react";
import { MAP_HEIGHT, MAP_WIDTH, buildTrackPath, findTrack, loadTracks } from "@/lib/circuits";

type State = { status: "loading" } | { status: "ready"; path: string } | { status: "missing" };

export function CircuitMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    loadTracks()
      .then((tracks) => {
        if (cancelled) return;
        const track = findTrack(tracks, lat, lng);
        setState(track ? { status: "ready", path: buildTrackPath(track.points) } : { status: "missing" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "missing" });
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  if (state.status === "loading") {
    return <div className="h-full animate-pulse rounded-xl bg-secondary/50" />;
  }

  if (state.status === "missing") {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-secondary/30 text-xs text-muted-foreground">
        Mapa no disponible
      </div>
    );
  }

  return (
    <svg role="img" aria-label={`Trazado de ${label}`} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="h-full w-full">
      <path
        d={state.path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}