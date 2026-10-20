import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

type Mode = "login" | "registro";
type Errors = Partial<Record<"email" | "password" | "confirm", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateAuth(mode: Mode, v: { email: string; password: string; confirm: string }): Errors {
  const e: Errors = {};
  if (!v.email.trim()) e.email = "Ingresá tu email.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "El email no tiene un formato válido.";
  if (!v.password) e.password = "Ingresá tu contraseña.";
  else if (mode === "registro" && v.password.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres.";
  if (mode === "registro" && v.confirm !== v.password) e.confirm = "Las contraseñas no coinciden.";
  return e;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [values, setValues] = useState({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const isLogin = mode === "login";

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const e = validateAuth(mode, values);
    setErrors(e);
    // TODO: conectar con Supabase
    setSent(Object.keys(e).length === 0);
  };

  const field = (name: keyof typeof values, label: string, type: string, auto: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        autoComplete={auto}
        value={values[name]}
        aria-invalid={!!errors[name]}
        onChange={(e) => setValues((s) => ({ ...s, [name]: e.target.value }))}
        className="h-11"
      />
      {errors[name] && <p className="text-sm text-destructive">{errors[name]}</p>}
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
          {field("email", "Email", "email", "email")}
          {field("password", "Contraseña", "password", isLogin ? "current-password" : "new-password")}
          {!isLogin && field("confirm", "Repetir contraseña", "password", "new-password")}
          {sent && (
            <p className="rounded-md bg-success/15 p-2 text-sm text-success">
              Formulario válido. La conexión con el servidor todavía no está activa.
            </p>
          )}
          <Button type="submit" className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide">
            {isLogin ? "Entrar" : "Registrarme"}
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
