import { useEffect, useState, type FormEvent } from "react";
import { CountryFlag } from "@/components/CountryFlag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, type Profile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_OPTIONS, countryFromMetadata, guessCountry } from "@/lib/countries";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const text = (value: unknown): string => (typeof value === "string" ? value : "");

// Un nombre de usuario posible a partir del nombre o del email (la persona lo puede cambiar).
function suggestUsername(source: string): string {
  const base = source.split("@")[0] ?? source;
  const slug = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return slug.length >= 3 ? slug : "";
}

// Pantalla que tapa la app hasta que la persona completa los datos obligatorios que le falten.
export function ProfileGate() {
  const { session } = useSession();
  const { profile, save } = useProfile();

  // Qué datos faltan: se calcula una sola vez para que los campos no cambien mientras se completan.
  const [need] = useState(() => ({
    username: !profile.username,
    displayName: !profile.display_name?.trim(),
    country: !profile.country,
  }));

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prellena lo que se pueda con los datos de la cuenta (Google trae nombre y email).
  useEffect(() => {
    const meta: Record<string, unknown> = session?.user.user_metadata ?? {};
    const fullName = text(meta["full_name"]) || text(meta["name"]);

    if (need.username) {
      const source = text(meta["username"]) || fullName || session?.user.email || "";
      setUsername((current) => current || suggestUsername(source));
    }
    if (need.displayName) setDisplayName((current) => current || fullName);
    if (need.country) setCountry((current) => current || countryFromMetadata(meta) || guessCountry());
  }, [session, need]);

  // La pantalla bloquea la app: se frena el scroll de atrás y se enfoca el primer campo.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstId = need.username ? "gate-username" : need.displayName ? "gate-name" : "gate-country";
    document.getElementById(firstId)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [need]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanName = displayName.trim();

    if (need.username && !USERNAME_RE.test(cleanUsername)) {
      setError("El nombre de usuario debe tener de 3 a 20 caracteres: minúsculas, números o guion bajo.");
      return;
    }
    if (need.displayName && cleanName.length < 2) {
      setError("Ingresá tu nombre visible (al menos 2 caracteres).");
      return;
    }
    if (need.country && !country) {
      setError("Elegí tu nacionalidad.");
      return;
    }

    setSaving(true);

    if (need.username) {
      const { data: available, error: checkError } = await supabase.rpc("username_available", {
        candidate: cleanUsername,
      });
      if (checkError) {
        console.error("Verificar nombre de usuario:", checkError);
        setSaving(false);
        setError("No pudimos verificar el nombre de usuario. Probá de nuevo en un momento.");
        return;
      }
      if (available === false) {
        setSaving(false);
        setError("Ese nombre de usuario ya está en uso. Probá con otro.");
        return;
      }
    }

    const changes: Partial<Profile> = {};
    if (need.username) changes.username = cleanUsername;
    if (need.displayName) changes.display_name = cleanName;
    if (need.country) changes.country = country;

    const result = await save(changes);
    setSaving(false);

    // Si se guardó, el perfil se recarga solo y esta pantalla desaparece.
    if (!result.ok) setError(result.message);
  };

  const askIdentity = need.username || need.displayName;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-gate-title"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur animate-in fade-in duration-300 motion-reduce:animate-none"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="my-auto w-full max-w-md space-y-5 rounded-2xl border bg-card p-6 shadow-glow animate-in zoom-in-95 duration-300 motion-reduce:animate-none"
      >
        <div aria-hidden="true" className="h-1.5 rounded-full racing-stripe opacity-60" />

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Un último paso</p>
          <h2 id="profile-gate-title" className="mt-1 font-display text-3xl font-bold uppercase">
            {askIdentity ? "Completá tu perfil" : "¿De dónde sos?"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {askIdentity
              ? "Así te ven tus amigos y aparecés en el ranking de predicciones. Podés cambiarlo cuando quieras en Ajustes → Perfil, y ocultarte en Ajustes → Privacidad."
              : "Elegí tu nacionalidad. Se muestra en tu perfil junto a tu nombre y podés cambiarla cuando quieras en Ajustes → Perfil."}
          </p>
        </div>

        {need.username && (
          <div className="space-y-1.5">
            <Label htmlFor="gate-username">Nombre de usuario</Label>
            <Input
              id="gate-username"
              value={username}
              maxLength={20}
              autoComplete="off"
              placeholder="ej. tifosi_44"
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setError(null);
              }}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">De 3 a 20 caracteres: minúsculas, números o guion bajo.</p>
          </div>
        )}

        {need.displayName && (
          <div className="space-y-1.5">
            <Label htmlFor="gate-name">Nombre visible</Label>
            <Input
              id="gate-name"
              value={displayName}
              maxLength={40}
              autoComplete="name"
              placeholder="Tu nombre"
              onChange={(e) => {
                setDisplayName(e.target.value);
                setError(null);
              }}
              className="h-11"
            />
          </div>
        )}

        {need.country && (
          <div className="space-y-1.5">
            <Label htmlFor="gate-country">Nacionalidad</Label>
            <div className="flex items-center gap-3">
              <select
                id="gate-country"
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
        )}

        {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-primary font-semibold transition-transform active:scale-95"
        >
          {saving ? "Guardando…" : "Continuar"}
        </Button>
      </form>
    </div>
  );
}