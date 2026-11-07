import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/PageSkeleton";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Empieza a cargar la página cuando pasás el mouse (o tocás) un link, antes de hacer clic.
    defaultPreload: "intent",
    defaultPreloadDelay: 150,
    // Lo precargado se reutiliza durante 30 segundos.
    defaultPreloadStaleTime: 30_000,
    // Si la página tarda en cargar, se muestra una pantalla con esqueletos (sin parpadeos).
    defaultPendingComponent: PageSkeleton,
    defaultPendingMs: 200,
    defaultPendingMinMs: 300,
  });

  return router;
};