import { useRouterState } from "@tanstack/react-router";

// Barra fina arriba de todo mientras el router está cargando la página nueva.
export function NavProgress() {
  const navigating = useRouterState({ select: (state) => state.isLoading });

  if (!navigating) return null;

  return (
    <div
      role="progressbar"
      aria-label="Cargando la página"
      className="nav-progress pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-primary/15"
    >
      <div className="nav-progress-bar h-full w-1/3 rounded-full bg-gradient-primary" />
    </div>
  );
}