import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "registro";
type Errors = Partial<Record<"email" | "password" | "confirm" | "terms" | "username" | "displayName", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function validateAuth(
  mode: Mode,
  v: {
    email: string;
    password: string;
    confirm: string;
    terms?: boolean;
    username?: string;
    displayName?: string;
  },
): Errors {
  const e: Errors = {};
  if (!v.email.trim()) e.email = "Ingresá tu email.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "El email no tiene un formato válido.";
  if (!v.password) e.password = "Ingresá tu contraseña.";
  else if (mode === "registro" && v.password.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
  if (mode === "registro" && v.confirm !== v.password) e.confirm = "Las contraseñas no coinciden.";
  if (mode === "registro" && v.terms === false) e.terms = "Tenés que aceptar los términos y la política de privacidad.";

  if (mode === "registro" && v.username !== undefined) {
    const username = v.username.trim();
    if (!username) e.username = "Elegí un nombre de usuario.";
    else if (!USERNAME_RE.test(username)) e.username = "Usá de 3 a 20 caracteres: minúsculas, números o guion bajo.";
  }

  if (mode === "registro" && v.displayName !== undefined) {
    const displayName = v.displayName.trim();
    if (!displayName) e.displayName = "Ingresá tu nombre visible.";
    else if (displayName.length < 2) e.displayName = "El nombre visible tiene que tener al menos 2 caracteres.";
  }

  return e;
}

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "Todavía no confirmaste tu email. Revisá tu bandeja de entrada.";
  if (m.includes("already registered")) return "Ya existe una cuenta con ese email.";
  if (m.includes("rate limit")) return "Hiciste demasiados intentos. Esperá un rato y probá de nuevo.";
  if (m.includes("database error saving new user")) return "No pudimos crear la cuenta. Probá con otro nombre de usuario.";
  return "No pudimos completar la operación. Probá de nuevo en un momento.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [values, setValues] = useState({ email: "", password: "", confirm: "", username: "", displayName: "" });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const isLogin = mode === "login";

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    setInfo(null);

    const e = validateAuth(mode, { ...values, terms: accepted });
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });
        if (error) {
          setServerError(translateError(error.message));
          return;
        }
        await navigate({ to: "/inicio" });
      } else {
        const username = values.username.trim();
        const displayName = values.displayName.trim();

        // Antes de registrar, verifica que el nombre de usuario esté libre.
        const { data: available, error: checkError } = await supabase.rpc("username_available", {
          candidate: username,
        });
        if (checkError) {
          console.error("Verificar nombre de usuario:", checkError);
          setServerError("No pudimos verificar el nombre de usuario. Probá de nuevo en un momento.");
          return;
        }
        if (available === false) {
          setErrors({ username: "Ese nombre de usuario ya está en uso." });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/inicio`,
            data: {
              username,
              display_name: displayName,
              accepted_terms_at: new Date().toISOString(),
            },
          },
        });
        if (error) {
          setServerError(translateError(error.message));
          return;
        }
        if (data.session) {
          // Confirmación de email desactivada: ya está logueado.
          await navigate({ to: "/inicio" });
        } else {
          // Confirmación de email activada: hay que validar el correo.
          setInfo("Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada.");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name: keyof typeof values, label: string, type: string, auto: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        autoComplete={auto}
        value={values[name]}
        aria-invalid={!!errors[name as keyof Errors]}
        maxLength={name === "username" ? 20 : name === "displayName" ? 40 : undefined}
        onChange={(e) => {
          // El nombre de usuario siempre va en minúsculas.
          const value = name === "username" ? e.target.value.toLowerCase() : e.target.value;
          setValues((s) => ({ ...s, [name]: value }));
        }}
        className="h-11"
      />
      {hint && !errors[name as keyof Errors] && <p className="text-xs text-muted-foreground">{hint}</p>}
      {errors[name as keyof Errors] && <p className="text-sm text-destructive">{errors[name as keyof Errors]}</p>}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border bg-card p-6 shadow-glow">
          <div>
            <h1 className="text-3xl font-bold uppercase italic">{isLogin ? "Iniciar sesión" : "Crear cuenta"}</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Volvé al muro de boxes." : "Sumate a la comunidad de PitWall."}
            </p>
          </div>

          {!isLogin &&
            field("username", "Nombre de usuario", "text", "off", "De 3 a 20 caracteres: minúsculas, números o guion bajo.")}
          {!isLogin && field("displayName", "Nombre visible", "text", "name")}

          {field("email", "Email", "email", "email")}
          {field("password", "Contraseña", "password", isLogin ? "current-password" : "new-password")}
          {!isLogin && field("confirm", "Repetir contraseña", "password", "new-password")}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  Acepto los{" "}
                  <Link to="/terminos" target="_blank" className="font-semibold text-primary hover:underline">
                    términos
                  </Link>{" "}
                  y la{" "}
                  <Link to="/privacidad" target="_blank" className="font-semibold text-primary hover:underline">
                    política de privacidad
                  </Link>
                  .
                </span>
              </label>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
            </div>
          )}

          {serverError && (
            <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{serverError}</p>
          )}
          {info && <p className="rounded-md bg-success/15 p-2 text-sm text-success">{info}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide"
          >
            {submitting ? "Procesando…" : isLogin ? "Entrar" : "Registrarme"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <Link to={isLogin ? "/registro" : "/login"} className="font-semibold text-primary hover:underline">
              {isLogin ? "Crear cuenta" : "Iniciar sesión"}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
