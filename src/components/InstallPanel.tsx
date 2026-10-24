import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { canPromptInstall, isIos, isStandalone, promptInstall, subscribeInstallPrompt } from "@/lib/install-prompt";

export function InstallPanel() {
  const [available, setAvailable] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStandalone(isStandalone());
    setIos(isIos());
    setAvailable(canPromptInstall());
    return subscribeInstallPrompt(() => setAvailable(canPromptInstall()));
  }, []);

  const onInstall = async () => {
    setMessage(null);
    const result = await promptInstall();
    if (result === "accepted") setMessage("¡Listo! PitWall se está instalando.");
    if (result === "dismissed") setMessage("Cancelaste la instalación. Podés volver a intentarlo cuando quieras.");
  };

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 md:p-6">
      <h2 className="text-xl font-bold uppercase">Instalar PitWall en tu celular</h2>

      {standalone ? (
        <p className="text-sm text-muted-foreground">Ya estás usando PitWall como app instalada.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Instalada, PitWall se abre desde un ícono en tu pantalla de inicio, a pantalla completa, como cualquier
            otra app.
          </p>

          {available && (
            <Button type="button" onClick={onInstall} className="bg-gradient-primary font-semibold">
              Instalar app
            </Button>
          )}

          {message && <p className="rounded-md bg-success/15 p-2 text-sm text-success">{message}</p>}

          {!available && ios && (
            <ol className="list-inside list-decimal space-y-1 text-sm">
              <li>Abrí esta página en <span className="font-semibold">Safari</span>.</li>
              <li>Tocá el botón <span className="font-semibold">Compartir</span> (el cuadrado con la flecha hacia arriba).</li>
              <li>Elegí <span className="font-semibold">Agregar a inicio</span>.</li>
            </ol>
          )}

          {!available && !ios && (
            <p className="text-sm text-muted-foreground">
              Si usás Chrome en Android, abrí el menú (los tres puntitos) y elegí{" "}
              <span className="font-semibold">Instalar app</span> o{" "}
              <span className="font-semibold">Agregar a la pantalla de inicio</span>. Si no aparece la opción, puede
              ser que ya esté instalada o que tu navegador no la ofrezca.
            </p>
          )}
        </>
      )}
    </div>
  );
}