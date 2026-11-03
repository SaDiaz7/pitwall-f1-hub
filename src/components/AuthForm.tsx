import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [values, setValues] = useState({ email: "", password: "", confirm: "", username: "", displayName: "" });
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
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
  const signInWithGoogle = async () => {
    setServerError(null);
    setInfo(null);
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/inicio` },
    });

    // Si todo sale bien, el navegador viaja a Google y no vuelve por acá.
    if (error) {
      console.error("Login con Google:", error);
      setServerError("No pudimos conectar con Google. Probá de nuevo en un momento.");
      setGoogleLoading(false);
    }
  };

  const field = (name: keyof typeof values, label: string, type: string, auto: string, hint?: string) => {
    const isPassword = type === "password";
    const shown = isPassword && visible[name] === true;
    const error = errors[name as keyof Errors];

    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <div className="relative">
          <Input
            id={name}
            type={shown ? "text" : type}
            autoComplete={auto}
            value={values[name]}
            aria-invalid={!!error}
            maxLength={name === "username" ? 20 : name === "displayName" ? 40 : undefined}
            onChange={(e) => {
              // El nombre de usuario siempre va en minúsculas.
              const value = name === "username" ? e.target.value.toLowerCase() : e.target.value;
              setValues((s) => ({ ...s, [name]: value }));
            }}
            className={cn("h-11", isPassword && "pr-11")}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((s) => ({ ...s, [name]: !s[name] }))}
              aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={shown}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  };

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

          <Button
            type="button"
            variant="outline"
            disabled={googleLoading || submitting}
            onClick={signInWithGoogle}
            className="h-11 w-full gap-3 font-semibold">
            <GoogleIcon />
            {googleLoading ? "Conectando…" : "Continuar con Google"}
          </Button>
          <p className="-mt-2 text-center text-xs text-muted-foreground">
            Sin contraseña nueva. Solo pedimos tu nombre, email y foto, y nunca publicamos nada. Al continuar
            aceptás los{" "}
            <Link to="/terminos" target="_blank" className="font-semibold text-primary hover:underline">
              términos
            </Link>{" "}
            y la{" "}
            <Link to="/privacidad" target="_blank" className="font-semibold text-primary hover:underline">
              política de privacidad
            </Link>
            .
          </p>

          <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            o con tu email
            <span className="h-px flex-1 bg-border" />
          </div>

          {!isLogin &&
            field("username", "Nombre de usuario", "text", "off", "De 3 a 20 caracteres: minúsculas, números o guion bajo.")}
          {!isLogin && field("displayName", "Nombre visible", "text", "name")}

          {field("email", "Email", "email", "email")}
          {field("password", "Contraseña", "password", isLogin ? "current-password" : "new-password")}
          {isLogin && (
            <div className="-mt-2 text-right">
              <Link to="/olvide" className="text-sm font-semibold text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
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
