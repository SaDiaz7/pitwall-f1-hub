export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", ...opts });
}
