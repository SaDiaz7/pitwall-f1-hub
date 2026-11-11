import { useEffect, useRef, useState, type FormEvent } from "react";
import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { COUNTRY_OPTIONS } from "@/lib/countries";

// País del idioma del navegador (por ejemplo "es-AR" → AR), si es un código válido.
function guessCountry(): string {
  const region = navigator.language.split("-")[1]?.toUpperCase();
  return region && COUNTRY_OPTIONS.some((option) => option.code === region) ? region : "";
}

// Pantalla que tapa la app hasta que la persona elige su nacionalidad.
export function CountryGate() {
  const { save } = useProfile();
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setCountry((current) => current || guessCountry());
  }, []);

  // La pantalla bloquea la app: se frena el scroll de atrás.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    selectRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!country) {
      setError("Elegí tu nacionalidad para continuar.");
      return;
    }

    setError(null);
    setSaving(true);
    const result = await save({ country });
    setSaving(false);

    // Si se guardó, el perfil se recarga solo y esta pantalla desaparece.
    if (!result.ok) setError(result.message);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-gate-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur animate-in fade-in duration-300 motion-reduce:animate-none"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-glow animate-in zoom-in-95 duration-300 motion-reduce:animate-none"
      >
        <div aria-hidden="true" className="h-1.5 rounded-full racing-stripe opacity-60" />

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Un último paso</p>
          <h2 id="country-gate-title" className="mt-1 font-display text-3xl font-bold uppercase">
            ¿De dónde sos?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Elegí tu nacionalidad. Se muestra en tu perfil junto a tu nombre y podés cambiarla cuando quieras en
            Ajustes → Perfil.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="country-gate" className="text-sm font-semibold">
            Nacionalidad
          </label>
          <div className="flex items-center gap-3">
            <select
              id="country-gate"
              ref={selectRef}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setError(null);
              }}
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Elegí un país…
              </option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            {country && <CountryFlag code={country} className="h-7 shrink-0" />}
          </div>
        </div>

        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={saving || !country}
          className="w-full bg-gradient-primary font-semibold transition-transform active:scale-95"
        >
          {saving ? "Guardando…" : "Continuar"}
        </Button>
      </form>
    </div>
  );
}