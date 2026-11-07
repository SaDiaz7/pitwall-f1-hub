// Pantalla de carga genérica: la forma de una página con bloques que brillan.
export function PageSkeleton() {
  return (
    <div className="skeleton-page space-y-6" aria-busy="true" aria-label="Cargando la página">      
      <div className="space-y-2">
        <div className="skeleton h-9 w-56" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="skeleton h-44 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-32" />
        <div className="skeleton h-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="skeleton h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
