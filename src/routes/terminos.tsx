import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terminos")({
  head: () => ({
    meta: [{ title: "Términos — PitWall" }],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold uppercase italic">Términos de uso</h1>
      <p className="text-sm text-muted-foreground">Borrador. Última actualización: octubre de 2026.</p>
      <p>
        PitWall es un proyecto personal y sin fines comerciales hecho por y para fans de la Fórmula 1. No está
        afiliado a la Fórmula 1, a la FIA ni a ningún equipo o piloto.
      </p>
      <p>
        Al crear una cuenta te comprometés a usar la página de forma respetuosa y a no subir contenido que no tengas
        derecho a compartir. Podemos eliminar cuentas o contenido que incumplan estas reglas.
      </p>
      <p>
        La página se ofrece tal cual está: puede tener errores, cambiar o dejar de funcionar sin previo aviso. Los
        datos deportivos provienen de fuentes de terceros y pueden contener errores o demoras.
      </p>
      <Link to="/registro" className="font-semibold text-primary hover:underline">
        Volver al registro
      </Link>
    </main>
  );
}