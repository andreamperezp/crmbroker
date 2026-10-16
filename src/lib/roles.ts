import { PASOS, type Estado, type Rol } from "./types";
import { daysBetween } from "./format";
import { cliente, vencidas } from "./rules";

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** Contador en vivo y si es una alerta (rojo) */
  badge?: (s: Estado) => number;
  alert?: boolean;
}

export interface RolInfo {
  rol: Rol;
  nombre: string;
  corto: string;
  icon: string;
  desc: string;
  href: string;
  /** Persona que usa el perfil en la demo */
  usuario: (s: Estado) => { nombre: string; cargo: string; email: string };
  nav: NavItem[];
}

const abiertas = (s: Estado) => s.gestiones.filter((g) => !g.rechazada && g.paso < PASOS[g.tipo].length - 1);
const delAsesor = (s: Estado, clienteId: string) => cliente(s, clienteId).asesorId === s.asesorActual;

export const ROLES: RolInfo[] = [
  {
    rol: "asesor",
    nombre: "Asesor comercial",
    corto: "Asesor",
    icon: "support_agent",
    desc: "Leads, ventas y postventa",
    href: "/asesor/pipeline",
    usuario: (s) => {
      const a = s.asesores.find((x) => x.id === s.asesorActual)!;
      return { nombre: a.nombre, cargo: `Asesora comercial · ${a.zona}`, email: `${a.nombre.split(" ")[0].toLowerCase()}@brokerflow.demo` };
    },
    nav: [
      { id: "pipeline", label: "Pipeline de leads", icon: "view_kanban", badge: (s) => s.leads.filter((l) => !["Ganada", "Perdida"].includes(l.etapa) && delAsesor(s, l.clienteId)).length },
      { id: "prospeccion", label: "Prospección con IA", icon: "auto_awesome" },
      { id: "cliente", label: "Ficha de cliente", icon: "person" },
      { id: "cotizador", label: "Cotizador", icon: "request_quote" },
      { id: "postventa", label: "Postventa", icon: "event_available", badge: (s) => s.tareas.filter((t) => !t.hecha && t.asesorId === s.asesorActual && t.fecha <= s.hoy).length },
      { id: "renovaciones", label: "Renovaciones", icon: "autorenew", badge: (s) => s.polizas.filter((p) => delAsesor(s, p.clienteId) && daysBetween(s.hoy, p.hasta) >= 0 && daysBetween(s.hoy, p.hasta) <= 60).length },
    ],
  },
  {
    rol: "admin",
    nombre: "Administración",
    corto: "Administración",
    icon: "assignment",
    desc: "Emisiones, endosos y siniestros",
    href: "/administracion/tramites",
    usuario: () => ({ nombre: "Julián Sosa", cargo: "Administración", email: "julian@brokerflow.demo" }),
    nav: [
      { id: "tramites", label: "Bandeja de trámites", icon: "inbox", badge: (s) => abiertas(s).length },
      { id: "emision", label: "Emisión de póliza", icon: "post_add", badge: (s) => abiertas(s).filter((g) => g.tipo === "Emisión").length },
      { id: "siniestros", label: "Siniestros", icon: "car_crash", badge: (s) => abiertas(s).filter((g) => g.tipo === "Siniestro").length },
      { id: "endosos", label: "Endosos", icon: "edit_document", badge: (s) => abiertas(s).filter((g) => g.tipo === "Endoso").length },
      { id: "documentacion", label: "Documentación", icon: "folder_open" },
    ],
  },
  {
    rol: "cobranzas",
    nombre: "Cobranzas",
    corto: "Cobranzas",
    icon: "payments",
    desc: "Cobro mensual y mora",
    href: "/cobranzas/tablero",
    usuario: () => ({ nombre: "Valeria Luna", cargo: "Cobranzas", email: "valeria@brokerflow.demo" }),
    nav: [
      { id: "tablero", label: "Tablero mensual", icon: "monitoring" },
      { id: "mora", label: "Mora", icon: "running_with_errors", alert: true, badge: (s) => new Set(vencidas(s).map((q) => q.clienteId)).size },
      { id: "contacto", label: "Gestión de contacto", icon: "forum", badge: (s) => new Set(vencidas(s).filter((q) => !q.promesa || q.promesa < s.hoy).map((q) => q.clienteId)).size },
      { id: "planes", label: "Planes de pago", icon: "calendar_month" },
      { id: "reportes", label: "Reportes", icon: "bar_chart" },
    ],
  },
  {
    rol: "cliente",
    nombre: "Autogestión",
    corto: "Cliente",
    icon: "person",
    desc: "Portal del asegurado",
    href: "/autogestion",
    usuario: (s) => {
      const c = s.clienteActual ? s.clientes.find((x) => x.id === s.clienteActual) : null;
      return { nombre: c?.nombre ?? "Visitante", cargo: c ? "Asegurada" : "Sin cuenta", email: c?.email ?? "" };
    },
    nav: [],
  },
];

const BASE: Record<Rol, string> = { asesor: "/asesor", admin: "/administracion", cobranzas: "/cobranzas", cliente: "/autogestion" };

export const rolDe = (pathname: string) => ROLES.find((r) => pathname.startsWith(BASE[r.rol]));
export const infoRol = (rol: Rol) => ROLES.find((r) => r.rol === rol)!;
export const hrefDe = (rol: Rol, vista?: string) => (vista ? `${BASE[rol]}/${vista}` : infoRol(rol).href);
