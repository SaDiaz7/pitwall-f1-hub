export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("different from the old")) return "La nueva contraseña tiene que ser distinta a la actual.";
  if (m.includes("reauthentication") || m.includes("recently")) {
    return "Por seguridad, cerrá sesión, volvé a entrar y probá de nuevo.";
  }
  if (m.includes("weak") || m.includes("at least")) {
    return "La contraseña es muy débil. Usá al menos 8 caracteres, mezclando letras y números.";
  }
  if (m.includes("rate limit")) return "Hiciste demasiados intentos. Esperá un rato y probá de nuevo.";
  if (m.includes("session") && m.includes("missing")) return "El enlace venció. Pedí uno nuevo.";
  return "No pudimos completar la operación. Probá de nuevo en un momento.";
}