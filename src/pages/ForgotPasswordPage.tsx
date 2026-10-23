import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { translateAuthError } from "@/lib/auth-errors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);

    const clean = email.trim();
    if (!EMAIL_RE.test(clean)) {
      setError("El email no tiene un formato válido.");
      return;
    }

    setSubmitting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setSubmitting(false);

    if (resetError) {
      console.error("Recuperar contraseña:", resetError);
      if (resetError.message.toLowerCase().includes("rate limit")) {
        setError(translateAuthError(resetError.message));
        return;
      }
    }

    // Mismo mensaje exista o no la cuenta.
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-glow">
          <div>
            <h1 className="text-3xl font-bold uppercase italic">Recuperar cuenta</h1>
            <p className="text-sm text-muted-foreground">
              Te mandamos un enlace para elegir una contraseña nueva.
            </p>
          </div>

          {sent ? (
            <p className="rounded-md bg-success/15 p-3 text-sm text-success">
              Si existe una cuenta con ese email, te enviamos un enlace. Revisá tu bandeja de entrada (y el spam).
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>

              {error && <p className="rounded-md bg-destructive/15 p-2 text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full bg-gradient-primary font-semibold uppercase tracking-wide"
              >
                {submitting ? "Enviando…" : "Enviar enlace"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}