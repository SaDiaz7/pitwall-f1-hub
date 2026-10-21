import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [{ title: "Privacidad — PitWall" }],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold uppercase italic">Política de privacidad</h1>
      <p className="text-sm text-muted-foreground">
        Borrador. Última actualización: octubre de 2026.
      </p>
      <p>
        Al registrarte guardamos tu email y tu contraseña (esta última, de forma protegida por el
        servicio de autenticación que usamos). Más adelante podremos guardar tus ajustes de perfil,
        tus pilotos favoritos y tus predicciones.
      </p>
      <p>
        Usamos el almacenamiento de tu navegador para mantener tu sesión iniciada. Por ahora no
        usamos cookies de publicidad ni de analítica.
      </p>
      <p>No vendemos tus datos. Podés pedir que eliminemos tu cuenta y tus datos cuando quieras.</p>
      <Link to="/registro" className="font-semibold text-primary hover:underline">
        Volver al registro
      </Link>
    </main>
  );
}
