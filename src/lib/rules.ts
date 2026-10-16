/** Reglas del negocio que usan todas las pantallas. */
import { daysBetween } from "./format";
import type { Cuota, Estado, EstadoPoliza, Gestion, Poliza } from "./types";

/** Días de atraso a partir de los cuales una cuota pasa de mora temprana a tardía. */
export const CORTE_MORA = 30;

export type EstadoCuota = "Pagada" | "Por vencer" | "Vence hoy" | "Mora temprana" | "Mora tardía" | "Refinanciada";

export function atraso(c: Cuota, hoy: string): number {
  return c.pagada ? 0 : Math.max(0, daysBetween(c.vence, hoy));
}

/** Estado según la fecha: lo que corresponde, aunque cobranzas todavía no lo haya confirmado. */
export function estadoCuota(c: Cuota, hoy: string): EstadoCuota {
  if (c.pagada) return "Pagada";
  if (c.planId) return "Refinanciada";
  const d = daysBetween(c.vence, hoy);
  if (d < 0) return "Por vencer";
  if (d === 0) return "Vence hoy";
  return d > CORTE_MORA ? "Mora tardía" : "Mora temprana";
}

/** La mora que corresponde y todavía no fue confirmada por cobranzas. */
export function moraPendiente(c: Cuota, hoy: string): "temprana" | "tardia" | null {
  const e = estadoCuota(c, hoy);
  const corresponde = e === "Mora tardía" ? "tardia" : e === "Mora temprana" ? "temprana" : null;
  if (!corresponde || c.mora === corresponde) return null;
  return corresponde;
}

/** Cuotas vencidas e impagas (sin refinanciar) */
export const vencidas = (s: Estado, clienteId?: string) =>
  s.cuotas.filter((q) => !q.pagada && !q.planId && q.vence < s.hoy && (!clienteId || q.clienteId === clienteId));

/** Deuda vencida de un cliente y su mayor atraso */
export function deudaDe(s: Estado, clienteId: string) {
  const qs = vencidas(s, clienteId);
  return { cuotas: qs, total: qs.reduce((t, q) => t + q.monto, 0), dias: Math.max(0, ...qs.map((q) => atraso(q, s.hoy))) };
}

/** Recargo de un plan de pago: hasta 3 cuotas sin recargo, 4 cuotas 5 %, 6 cuotas 10 % */
export const recargoPlan = (cuotas: number) => (cuotas <= 3 ? 0 : cuotas <= 4 ? 5 : 10);

export function estadoPoliza(p: Poliza, hoy: string): EstadoPoliza {
  const d = daysBetween(hoy, p.hasta);
  if (d < 0) return "Vencida";
  return d <= 30 ? "Por renovar" : "Vigente";
}

/** Tiempo de respuesta de un trámite: verde con margen, ámbar el último día, rojo vencido */
export function sla(g: Gestion, hoy: string): { label: string; tone: "ok" | "warn" | "danger" } {
  const d = daysBetween(hoy, g.vence);
  if (d < 0) return { label: `Vencido hace ${-d} ${-d === 1 ? "día" : "días"}`, tone: "danger" };
  if (d === 0) return { label: "Vence hoy", tone: "warn" };
  if (d === 1) return { label: "Vence mañana", tone: "warn" };
  return { label: `${d} días`, tone: "ok" };
}

export const cliente = (s: Estado, id: string) => s.clientes.find((c) => c.id === id)!;
export const asesor = (s: Estado, id: string) => s.asesores.find((a) => a.id === id)!;
export const poliza = (s: Estado, id?: string) => (id ? s.polizas.find((p) => p.id === id) : undefined);

/** El asesor con menos clientes y leads abiertos: así se reparte el trabajo de las altas. */
export function asesorConMenosCarga(s: Estado): string {
  const carga = (id: string) =>
    s.clientes.filter((c) => c.asesorId === id).length +
    s.leads.filter((l) => !["Ganada", "Perdida"].includes(l.etapa) && cliente(s, l.clienteId).asesorId === id).length;
  return [...s.asesores].sort((a, b) => carga(a.id) - carga(b.id))[0].id;
}
