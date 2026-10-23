import type { ErrorComponentProps } from "@tanstack/react-router";

export function DataError({ error }: Partial<ErrorComponentProps>) {
  // Deja el detalle en la consola para poder diagnosticar.
  if (error) console.error("Error al cargar datos:", error);

  // Solo en desarrollo mostramos el mensaje técnico en pantalla.
  const detail = import.meta.env.DEV && error instanceof Error ? error.message : null;

  return (
    <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
      <p>No pudimos cargar los datos de la Fórmula 1 en este momento. Probá de nuevo en unos minutos.</p>
      {detail && <p className="mt-3 break-words font-mono text-xs">{detail}</p>}
    </div>
  );
}
