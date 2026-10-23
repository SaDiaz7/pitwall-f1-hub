import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

export function ResetPasswordPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      console.error("Actualizar contraseña:", updateError);
      setError(translateAuthError(updateError.message));
      return;
    }

    setDone(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-glow">
          <h1 className="text-3xl font-bold uppercase italic">Nueva contraseña</h1>

          {loading ? (
            <p className="text-sm text-muted-foreground">Verificando el enlace…</p>
          ) : !session ? (
            <div className="space-y-3">
              <p className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                El enlace no es válido o ya venció. Pedí uno nuevo.
              </p>
              <Link to="/olvide" className="text-sm font-semibold text-primary hover:underline">
                Pedir un enlace nuevo
              </Link>
            </div>
          ) : done ? (
            <div className="space-y-3">
              <p className="rounded-md bg-success/15 p-3 text-sm text-success">Listo, ya cambiaste tu contraseña.</p>
              <Button
                type="button"
                onClick={() => navigate({ to: "/inicio" })}
                className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide"
              >
                Ir al inicio
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Contraseña nueva</Label>
                <PasswordInput
                  id="new-password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Repetir contraseña</Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide"
              >
                {submitting ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}