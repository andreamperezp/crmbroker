/**
 * Datos iniciales de la demo, armados en relación a la fecha de hoy para que
 * siempre haya cuotas por vencer, moras y tareas del día. Todo es inventado:
 * personas, comercios, patentes, aseguradoras y teléfonos.
 */
import { addDays, addMonths } from "./format";
import type { Cliente, Cuota, Estado, Gestion, Lead, Poliza, Prospecto, Ramo, Tarea } from "./types";

export const ASEGURADORAS = ["Ceibo Seguros", "Alerce Seguros", "Faro Seguros", "Brisa Seguros"];

type Situacion = "al día" | "temprana" | "temprana-marcada" | "tardia" | "tardia-marcada";

interface PolizaSeed {
  cliente: string;
  ramo: Ramo;
  bien: string;
  aseguradora: number;
  prima: number;
  suma: number;
  /** días hasta la próxima cuota */
  proxima: number;
  /** días hasta el fin de la vigencia */
  vigencia: number;
  situacion: Situacion;
}

const CLIENTES: [string, string, string, string, Cliente["origen"], number][] = [
  // id, nombre, ciudad, asesor, origen, meses como cliente
  ["c1", "Lucía Fernández", "La Plata", "a1", "Web", 14],
  ["c2", "Hernán Acosta", "City Bell", "a2", "Referido", 30],
  ["c3", "Sofía Medina", "La Plata", "a1", "Referido", 1],
  ["c4", "Panadería Don Ramón", "Berisso", "a3", "Cartera", 48],
  ["c5", "Julieta Castro", "Gonnet", "a2", "Web", 11],
  ["c6", "Matías Herrera", "La Plata", "a1", "Cartera", 26],
  ["c7", "Valentina Ruiz", "Ensenada", "a3", "Web", 8],
  ["c8", "Ferretería El Tornillo", "La Plata", "a1", "Referido", 35],
  ["c9", "Camila Ortiz", "City Bell", "a2", "Cartera", 19],
  ["c10", "Federico Luna", "La Plata", "a1", "Web", 22],
  ["c11", "Rocío Benítez", "Berisso", "a3", "Referido", 5],
  ["c12", "Ezequiel Romero", "La Plata", "a1", "Referido", 0],
  // Prospectos que todavía son leads
  ["c13", "Agustina Silva", "La Plata", "a1", "Web", 0],
  ["c14", "Bruno Díaz", "Gonnet", "a1", "Referido", 0],
  ["c15", "Estudio Contable Paredes", "La Plata", "a1", "Referido", 0],
  ["c16", "Natalia Vega", "City Bell", "a1", "Web", 0],
  ["c17", "Tomás Aguirre", "La Plata", "a1", "Autogestión", 0],
  ["c18", "Kiosco La Esquina", "Ensenada", "a3", "Cartera", 0],
  ["c19", "Lorena Sosa", "City Bell", "a2", "Web", 0],
  ["c20", "Pablo Giménez", "La Plata", "a1", "Web", 0],
  ["c21", "Martín Quiroga", "La Plata", "a1", "Referido", 0],
];

const POLIZAS: PolizaSeed[] = [
  { cliente: "c1", ramo: "Auto", bien: "Peugeot 208 2021 · AF 482 KD", aseguradora: 0, prima: 48_900, suma: 18_500_000, proxima: 6, vigencia: 25, situacion: "al día" },
  { cliente: "c1", ramo: "Hogar", bien: "Calle 12 n.º 1450, La Plata", aseguradora: 1, prima: 21_300, suma: 42_000_000, proxima: 6, vigencia: 210, situacion: "al día" },
  { cliente: "c2", ramo: "Auto", bien: "Toyota Etios 2019 · AD 117 LM", aseguradora: 2, prima: 41_200, suma: 13_900_000, proxima: 17, vigencia: 160, situacion: "temprana-marcada" },
  { cliente: "c3", ramo: "Vida", bien: "Vida individual · 2 beneficiarios", aseguradora: 3, prima: 15_800, suma: 30_000_000, proxima: 9, vigencia: 340, situacion: "al día" },
  { cliente: "c4", ramo: "Comercio", bien: "Panadería · Av. Montevideo 1820, Berisso", aseguradora: 1, prima: 67_400, suma: 85_000_000, proxima: 11, vigencia: 120, situacion: "tardia-marcada" },
  { cliente: "c5", ramo: "Hogar", bien: "Camino Belgrano 4510, Gonnet", aseguradora: 0, prima: 24_600, suma: 51_000_000, proxima: 4, vigencia: 18, situacion: "al día" },
  { cliente: "c6", ramo: "Auto", bien: "Volkswagen Gol Trend 2018 · AC 903 PR", aseguradora: 2, prima: 39_700, suma: 11_200_000, proxima: 8, vigencia: 95, situacion: "al día" },
  { cliente: "c6", ramo: "Accidentes personales", bien: "Trabajo independiente · electricista", aseguradora: 3, prima: 9_400, suma: 15_000_000, proxima: 8, vigencia: 230, situacion: "al día" },
  { cliente: "c7", ramo: "Auto", bien: "Fiat Cronos 2022 · AG 220 TB", aseguradora: 0, prima: 52_300, suma: 21_400_000, proxima: 18, vigencia: 280, situacion: "temprana" },
  { cliente: "c8", ramo: "Comercio", bien: "Ferretería · Calle 7 n.º 980, La Plata", aseguradora: 2, prima: 58_900, suma: 70_000_000, proxima: 5, vigencia: 300, situacion: "al día" },
  { cliente: "c9", ramo: "Vida", bien: "Vida individual · 1 beneficiario", aseguradora: 1, prima: 12_900, suma: 20_000_000, proxima: 13, vigencia: 190, situacion: "al día" },
  { cliente: "c10", ramo: "Hogar", bien: "Diagonal 74 n.º 2210, La Plata", aseguradora: 3, prima: 19_800, suma: 38_000_000, proxima: 10, vigencia: 140, situacion: "tardia" },
  { cliente: "c11", ramo: "Auto", bien: "Chevrolet Onix 2020 · AE 551 QS", aseguradora: 0, prima: 44_100, suma: 15_300_000, proxima: 15, vigencia: 260, situacion: "al día" },
  { cliente: "c12", ramo: "Auto", bien: "Renault Sandero 2023 · AH 078 JC", aseguradora: 1, prima: 49_500, suma: 19_800_000, proxima: 26, vigencia: 360, situacion: "al día" },
];

const TELEFONOS = ["221 455-0193", "221 612-3380", "221 498-2271", "221 530-7742", "221 587-1106", "221 641-9025", "221 473-5518", "221 609-2834"];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");

export function seed(hoy: string): Estado {
  const clientes: Cliente[] = CLIENTES.map(([id, nombre, ciudad, asesorId, origen, meses], i) => ({
    id,
    nombre,
    ciudad,
    asesorId,
    origen,
    dni: String(28_000_000 + i * 731_457).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
    telefono: TELEFONOS[i % TELEFONOS.length],
    email: `${slug(nombre)}@ejemplo.com`,
    desde: addMonths(hoy, -meses),
  }));

  const polizas: Poliza[] = [];
  const cuotas: Cuota[] = [];
  POLIZAS.forEach((p, i) => {
    const id = `p${i + 1}`;
    const hasta = addDays(hoy, p.vigencia);
    polizas.push({
      id,
      numero: `BF-${(40_210 + i * 137).toString()}`,
      clienteId: p.cliente,
      ramo: p.ramo,
      aseguradora: ASEGURADORAS[p.aseguradora],
      bien: p.bien,
      desde: addMonths(hasta, -12),
      hasta,
      prima: p.prima,
      suma: p.suma,
    });
    // Tres cuotas anteriores y la próxima
    const proxima = addDays(hoy, p.proxima);
    for (let k = -3; k <= 0; k++) {
      const vence = addMonths(proxima, k);
      const impaga =
        (k === -1 && p.situacion !== "al día") || (k === -2 && (p.situacion === "tardia" || p.situacion === "tardia-marcada"));
      const cuota: Cuota = {
        id: `${id}-q${k + 4}`,
        polizaId: id,
        clienteId: p.cliente,
        nro: 9 + k,
        vence,
        monto: p.prima,
        historial: [],
      };
      if (k < 0 && !impaga) {
        cuota.pagada = addDays(vence, -((i + k + 5) % 4));
        cuota.medio = ["Débito automático", "Transferencia", "Tarjeta de crédito", "Mercado Pago"][(i + k + 4) % 4];
      }
      if (impaga) {
        cuota.historial.push({ fecha: addDays(vence, 3), texto: "Recordatorio automático por WhatsApp" });
        if (p.situacion === "temprana-marcada" && k === -1) cuota.mora = "temprana";
        if (p.situacion === "tardia-marcada") cuota.mora = k === -2 ? "tardia" : "temprana";
      }
      cuotas.push(cuota);
    }
  });
  // Valentina prometió pagar
  const cuotaValentina = cuotas.find((c) => c.clienteId === "c7" && !c.pagada && c.vence < hoy);
  if (cuotaValentina) {
    cuotaValentina.promesa = addDays(hoy, 2);
    cuotaValentina.historial.push({ fecha: addDays(hoy, -1), texto: "Llamada: prometió pagar por transferencia" });
  }

  const lead = (
    id: string,
    clienteId: string,
    ramo: Ramo,
    bien: string,
    etapa: Lead["etapa"],
    contacto: Lead["contacto"],
    prima: number,
    proxAccion: string,
    dias: number,
    creadoHace: number,
    notas: string[] = [],
  ): Lead => {
    const cliente = clientes.find((c) => c.id === clienteId)!;
    return {
      id,
      clienteId,
      ramo,
      bien,
      etapa,
      contacto,
      prima,
      proxAccion,
      proxFecha: addDays(hoy, dias),
      origen: cliente.origen,
      creado: addDays(hoy, -creadoHace),
      notas: notas.map((texto, k) => ({ fecha: addDays(hoy, -creadoHace + k + 1), texto })),
    };
  };

  const leads: Lead[] = [
    lead("l1", "c13", "Auto", "Ford Ka 2017", "Nueva", "Sin contactar", 36_500, "Primer llamado", 0, 1),
    lead("l2", "c17", "Hogar", "Departamento en calle 50", "Nueva", "Sin contactar", 18_200, "Primer llamado", 0, 0),
    lead("l3", "c14", "Auto", "Citroën C3 2020", "Contactada", "Respondió", 42_800, "Enviar cotización", 1, 4, ["Llamado: le interesa cambiar de compañía", "Pidió cotizar con granizo"]),
    lead("l4", "c15", "Comercio", "Oficina · Calle 48 n.º 670", "Cotizada", "Respondió", 61_000, "Seguimiento de la cotización", 2, 9, ["Reunión en el estudio", "Cotización enviada con 3 opciones"]),
    lead("l5", "c16", "Hogar", "Casa en City Bell", "Negociación", "Respondió", 27_400, "Cerrar: comparar franquicia", 1, 15, ["Cotización enviada", "Pide bajar la franquicia"]),
    lead("l6", "c18", "Comercio", "Kiosco · Ensenada", "Contactada", "No responde", 22_900, "Segundo intento por WhatsApp", 0, 6, ["Llamado sin respuesta"]),
    lead("l7", "c19", "Vida", "Vida individual", "Cotizada", "Respondió", 14_300, "Seguimiento", 3, 8),
    lead("l8", "c20", "Auto", "Fiat Palio 2014", "Perdida", "Respondió", 31_000, "Eligió otra compañía por precio", 30, 20, ["Cotización enviada", "Eligió otro broker por precio"]),
    lead("l9", "c21", "Auto", "Volkswagen Polo 2022", "Ganada", "Respondió", 50_100, "Esperando la póliza", 2, 12, ["Aceptó la cotización de Ceibo Seguros"]),
  ];

  const gestion = (
    id: string,
    tipo: Gestion["tipo"],
    clienteId: string,
    ramo: Ramo,
    detalle: string,
    paso: number,
    creadaHace: number,
    venceEn: number,
    extra: Partial<Gestion> = {},
  ): Gestion => ({
    id,
    tipo,
    clienteId,
    ramo,
    detalle,
    paso,
    creada: addDays(hoy, -creadaHace),
    vence: addDays(hoy, venceEn),
    historial: [{ fecha: addDays(hoy, -creadaHace), texto: "Trámite iniciado" }],
    ...extra,
  });

  const gestiones: Gestion[] = [
    gestion("g1", "Emisión", "c21", "Auto", "Volkswagen Polo 2022 · Ceibo Seguros · todo riesgo con franquicia", 1, 2, 2, { leadId: "l9" }),
    gestion("g2", "Siniestro", "c6", "Auto", "Choque trasero en Av. 7 y 50. Sin lesionados. Falta presupuesto del taller.", 1, 3, 3, { polizaId: "p7" }),
    gestion("g3", "Endoso", "c12", "Auto", "Cambio de patente por vehículo nuevo", 0, 4, -1, { polizaId: "p14" }),
    gestion("g4", "Renovación", "c5", "Hogar", "La póliza vence pronto: cotizar renovación con ajuste de suma asegurada", 0, 1, 5, { polizaId: "p6" }),
    gestion("g5", "Endoso", "c8", "Comercio", "Agregar cobertura de cristales a la vidriera", 1, 2, 4, { polizaId: "p10" }),
    gestion("g6", "Baja", "c9", "Vida", "Pide la baja por cambio de trabajo: ofrecer alternativa antes de confirmar", 0, 0, 3, { polizaId: "p11" }),
  ];

  const tarea = (id: string, clienteId: string, tipo: Tarea["tipo"], dias: number, detalle: string, hecha = false): Tarea => ({
    id,
    clienteId,
    asesorId: clientes.find((c) => c.id === clienteId)!.asesorId,
    tipo,
    fecha: addDays(hoy, dias),
    detalle,
    hecha,
  });

  const tareas: Tarea[] = [
    tarea("t1", "c12", "Bienvenida", 0, "Llamar para darle la bienvenida y explicarle cómo usar la autogestión"),
    tarea("t2", "c6", "Post-siniestro", 0, "Preguntarle cómo está y contarle en qué paso va su siniestro"),
    tarea("t3", "c10", "Deuda", 0, "Tiene cuotas atrasadas: entender qué le pasa antes de que caiga la cobertura"),
    tarea("t4", "c3", "Control 30 días", 1, "Chequear que tenga claro qué cubre su seguro de vida y quiénes son sus beneficiarios"),
    tarea("t5", "c1", "Renovación", 3, "Su póliza de auto vence en menos de un mes: adelantarle la propuesta de renovación"),
    tarea("t6", "c8", "Aniversario", 6, "Cumple 3 años con nosotros: revisar si su cobertura sigue acompañando el crecimiento del local"),
    tarea("t7", "c1", "Control 30 días", -20, "Consultó por la cobertura de granizo: se la expliqué", true),
  ];

  return {
    hoy,
    asesores: [
      { id: "a1", nombre: "Martina Ríos", zona: "La Plata" },
      { id: "a2", nombre: "Diego Paz", zona: "City Bell y Gonnet" },
      { id: "a3", nombre: "Carla Gómez", zona: "Berisso y Ensenada" },
    ],
    asesorActual: "a1",
    clientes,
    leads,
    polizas,
    gestiones,
    cuotas,
    tareas,
    prospectos: [],
    eventos: [],
    clienteActual: "c1",
    seq: 100,
  };
}

/** Lo que "encuentra" la IA en la simulación. Señales públicas o con consentimiento, nunca datos sensibles. */
export const PROSPECTOS_POOL: Omit<Prospecto, "id" | "estado">[] = [
  { nombre: "Café Molienda", ciudad: "City Bell", ramo: "Comercio", bien: "Cafetería · Calle 14 bis", senal: "Registró una habilitación comercial nueva este mes", fuente: "Boletín municipal", afinidad: 91, telefono: "221 590-4412", email: "hola@cafemolienda.ejemplo.com" },
  { nombre: "Andrés Cabrera", ciudad: "Ensenada", ramo: "Auto", bien: "Auto 0 km", senal: "Pidió cotizaciones en un comparador y aceptó ser contactado", fuente: "Formulario con consentimiento", afinidad: 88, telefono: "221 577-3091", email: "andres.cabrera@ejemplo.com" },
  { nombre: "Sabrina Álvarez", ciudad: "La Plata", ramo: "Auto", bien: "Auto usado recién comprado", senal: "Publicó la venta de su auto anterior: probablemente cambió de vehículo", fuente: "Clasificados públicos", afinidad: 84, telefono: "221 603-7720", email: "sabrina.alvarez@ejemplo.com" },
  { nombre: "Gimnasio Pulso", ciudad: "La Plata", ramo: "Comercio", bien: "Gimnasio · Calle 44 n.º 1205", senal: "Anunció su inauguración en sus redes", fuente: "Redes sociales públicas", afinidad: 83, telefono: "221 465-2208", email: "contacto@pulso.ejemplo.com" },
  { nombre: "Nicolás Herrera", ciudad: "La Plata", ramo: "Auto", bien: "Auto familiar", senal: "Hermano de un cliente tuyo, que te recomendó", fuente: "Referido de tu cartera", afinidad: 81, telefono: "221 512-6648", email: "nicolas.herrera@ejemplo.com" },
  { nombre: "Estudio Jurídico Correa", ciudad: "La Plata", ramo: "Comercio", bien: "Segunda oficina · Calle 9", senal: "Abrió una segunda oficina según su sitio web", fuente: "Sitio web de la empresa", afinidad: 79, telefono: "221 489-1173", email: "estudio@correa.ejemplo.com" },
  { nombre: "Taller Mecánico Sur", ciudad: "Berisso", ramo: "Comercio", bien: "Taller · Calle Nueva York", senal: "Es proveedor de dos clientes tuyos: buen candidato a referido", fuente: "Tu cartera de clientes", afinidad: 77, telefono: "221 544-8023", email: "tallersur@ejemplo.com" },
  { nombre: "Marcos Peralta", ciudad: "Gonnet", ramo: "Hogar", bien: "Casa recién alquilada", senal: "Actualizó su ciudad en un perfil profesional público: se mudó", fuente: "Perfil profesional público", afinidad: 74, telefono: "221 618-2950", email: "marcos.peralta@ejemplo.com" },
  { nombre: "Paula Domínguez", ciudad: "La Plata", ramo: "Hogar", bien: "Departamento a estrenar", senal: "Se registró en un lanzamiento inmobiliario y aceptó ser contactada", fuente: "Formulario con consentimiento", afinidad: 72, telefono: "221 471-6634", email: "paula.dominguez@ejemplo.com" },
  { nombre: "Librería La Hoja", ciudad: "Gonnet", ramo: "Comercio", bien: "Librería · Camino Centenario", senal: "Renovó el local y sumó vidriera", fuente: "Redes sociales públicas", afinidad: 70, telefono: "221 552-0187", email: "lahoja@ejemplo.com" },
  { nombre: "Florencia Ibarra", ciudad: "Berisso", ramo: "Accidentes personales", bien: "Trabajo independiente", senal: "Se registró como profesional independiente", fuente: "Padrón público de profesionales", afinidad: 68, telefono: "221 630-4459", email: "florencia.ibarra@ejemplo.com" },
  { nombre: "Verónica Lagos", ciudad: "City Bell", ramo: "Accidentes personales", bien: "Coordinadora de viajes grupales", senal: "Organiza viajes grupales según su sitio web", fuente: "Sitio web propio", afinidad: 64, telefono: "221 498-7316", email: "veronica.lagos@ejemplo.com" },
];
