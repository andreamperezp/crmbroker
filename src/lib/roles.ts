import type { Rol } from "./types";

export interface RolInfo {
  rol: Rol;
  nombre: string;
  corto: string;
  href: string;
  color: string;
  quien: string;
  para: string;
}

export const ROLES: RolInfo[] = [
  { rol: "cliente", nombre: "Autogestión", corto: "Cliente", href: "/autogestion", color: "var(--rol-cliente)", quien: "Lucía, clienta desde hace un año", para: "Ver sus pólizas, pagar, denunciar un siniestro o pedir una cotización sin llamar a nadie." },
  { rol: "asesor", nombre: "Asesor comercial", corto: "Asesor", href: "/asesor", color: "var(--rol-asesor)", quien: "Martina, asesora en La Plata", para: "Conseguir clientes nuevos, seguir cada oportunidad y acompañar a su cartera después de la venta." },
  { rol: "admin", nombre: "Administración", corto: "Administración", href: "/administracion", color: "var(--rol-admin)", quien: "Julián, del equipo administrativo", para: "Emitir pólizas, aplicar cambios y llevar cada siniestro hasta que se liquida." },
  { rol: "cobranzas", nombre: "Cobranzas", corto: "Cobranzas", href: "/cobranzas", color: "var(--rol-cobranzas)", quien: "Valeria, de cobranzas", para: "Cobrar las cuotas del mes y acompañar a quien se atrasa antes de que pierda su cobertura." },
];

export const rolDe = (pathname: string) => ROLES.find((r) => pathname.startsWith(r.href));
export const infoRol = (rol: Rol) => ROLES.find((r) => r.rol === rol)!;
