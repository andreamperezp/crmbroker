/** Fechas y montos en formato argentino. Las fechas viajan como ISO (YYYY-MM-DD). */

const DAY = 86_400_000;

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + months);
  return isoDate(d);
}

/** Días de `a` a `b` (positivo si `b` es posterior). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / DAY);
}

const fechaCorta = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" });
const fechaLarga = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });

export const fmtFecha = (iso: string) => fechaCorta.format(parseISO(iso)).replace(".", "");
export const fmtFechaLarga = (iso: string) => fechaLarga.format(parseISO(iso));

/** "hoy", "mañana", "en 3 días", "hace 2 días" */
export function relativo(iso: string, hoy: string): string {
  const d = daysBetween(hoy, iso);
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  if (d === -1) return "ayer";
  return d > 0 ? `en ${d} días` : `hace ${-d} días`;
}

const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
export const fmtPesos = (n: number) => pesos.format(n);

export const iniciales = (nombre: string) =>
  nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
