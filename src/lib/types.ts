/** Modelo de datos de la demo. Todo es ficticio y vive en el navegador. */

export type Rol = "cliente" | "asesor" | "admin" | "cobranzas";

export const RAMOS = ["Auto", "Hogar", "Vida", "Comercio", "Accidentes personales"] as const;
export type Ramo = (typeof RAMOS)[number];

export type Origen = "Cartera" | "Referido" | "Web" | "Autogestión" | "Prospección IA";

export interface Asesor {
  id: string;
  nombre: string;
  zona: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  ciudad: string;
  asesorId: string;
  origen: Origen;
  desde: string; // fecha ISO de alta
}

export const ETAPAS = ["Nueva", "Contactada", "Cotizada", "Negociación", "Ganada", "Perdida"] as const;
export type Etapa = (typeof ETAPAS)[number];

export const CONTACTOS = ["Sin contactar", "Contactado", "Respondió", "No responde"] as const;
export type EstadoContacto = (typeof CONTACTOS)[number];

export interface Lead {
  id: string;
  clienteId: string;
  ramo: Ramo;
  bien: string;
  etapa: Etapa;
  contacto: EstadoContacto;
  prima: number; // prima mensual estimada en ARS
  proxAccion: string;
  proxFecha: string;
  origen: Origen;
  creado: string;
  notas: { fecha: string; texto: string }[];
}

export type EstadoPoliza = "Vigente" | "Por renovar" | "Vencida";

export interface Poliza {
  id: string;
  numero: string;
  clienteId: string;
  ramo: Ramo;
  aseguradora: string;
  bien: string;
  desde: string;
  hasta: string;
  prima: number;
  suma: number;
}

export const TIPOS_GESTION = ["Emisión", "Endoso", "Siniestro", "Renovación", "Baja"] as const;
export type TipoGestion = (typeof TIPOS_GESTION)[number];

/** Los pasos de cada trámite, en orden. El último lo da por terminado. */
export const PASOS: Record<TipoGestion, string[]> = {
  Emisión: ["Datos recibidos", "Pedido a la aseguradora", "Póliza emitida"],
  Endoso: ["Pedido recibido", "Enviado a la aseguradora", "Cambio aplicado"],
  Siniestro: ["Denuncia recibida", "Documentación", "En la aseguradora", "Liquidado"],
  Renovación: ["Cotizar renovación", "Aceptada por el cliente", "Renovada"],
  Baja: ["Pedido de baja", "Baja confirmada"],
};

export interface Gestion {
  id: string;
  tipo: TipoGestion;
  clienteId: string;
  polizaId?: string;
  leadId?: string;
  ramo: Ramo;
  detalle: string;
  paso: number;
  creada: string;
  vence: string; // tiempo de respuesta comprometido
  historial: { fecha: string; texto: string }[];
}

export type NivelMora = "temprana" | "tardia";

export interface Cuota {
  id: string;
  polizaId: string;
  clienteId: string;
  nro: number;
  vence: string;
  monto: number;
  pagada?: string;
  medio?: string;
  mora?: NivelMora; // la marca cobranzas cuando confirma el pase a mora
  promesa?: string;
  historial: { fecha: string; texto: string }[];
}

export const TIPOS_TAREA = ["Bienvenida", "Control 30 días", "Renovación", "Post-siniestro", "Deuda", "Aniversario"] as const;
export type TipoTarea = (typeof TIPOS_TAREA)[number];

export interface Tarea {
  id: string;
  clienteId: string;
  asesorId: string;
  tipo: TipoTarea;
  fecha: string;
  detalle: string;
  hecha: boolean;
}

export interface Prospecto {
  id: string;
  nombre: string;
  ciudad: string;
  ramo: Ramo;
  bien: string;
  senal: string;
  fuente: string;
  afinidad: number; // 0 a 100
  telefono: string;
  email: string;
  estado: "nuevo" | "agregado" | "descartado";
}

export interface Evento {
  id: string;
  fecha: string;
  para: Rol;
  texto: string;
  /** Para avisos al cliente: a quién le corresponde */
  clienteId?: string;
}

export interface Estado {
  hoy: string;
  asesores: Asesor[];
  asesorActual: string;
  clientes: Cliente[];
  leads: Lead[];
  polizas: Poliza[];
  gestiones: Gestion[];
  cuotas: Cuota[];
  tareas: Tarea[];
  prospectos: Prospecto[];
  eventos: Evento[];
  clienteActual: string | null;
  seq: number;
}
