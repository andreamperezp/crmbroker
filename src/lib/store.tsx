"use client";

/**
 * Estado de la demo, compartido por los 4 perfiles. Vive en memoria: al recargar
 * la página (o con "Reiniciar demo") vuelve a los datos iniciales.
 * Cada acción deja eventos para los otros perfiles: así se ve cómo se conectan.
 */
import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { addDays, addMonths, isoDate } from "./format";
import { asesorConMenosCarga, cliente as getCliente, recargoPlan } from "./rules";
import { ASEGURADORAS, PROSPECTOS_POOL, seed } from "./seed";
import { CHECKLIST, PASOS, type Estado, type Lead, type Mensaje, type NivelMora, type Ramo, type Rol, type Tarea } from "./types";

export type Accion =
  | { t: "init"; hoy: string }
  | { t: "reset" }
  | { t: "cliente/elegir"; id: string }
  | { t: "cliente/alta"; nombre: string; dni: string; telefono: string; email: string; ciudad: string; ramo: Ramo; bien: string }
  | { t: "cliente/cotizar"; clienteId: string; ramo: Ramo; bien: string }
  | { t: "cliente/pagar"; cuotaId: string; medio: string }
  | { t: "cliente/siniestro"; polizaId: string; que: string; cuando: string; descripcion: string }
  | { t: "cliente/mensaje"; clienteId: string; texto: string }
  | { t: "asesor/elegir"; id: string }
  | { t: "lead/etapa"; leadId: string; etapa: Lead["etapa"] }
  | { t: "lead/contacto"; leadId: string; contacto: Lead["contacto"] }
  | { t: "lead/nota"; leadId: string; texto: string }
  | { t: "ia/buscar" }
  | { t: "ia/agregar"; prospectoId: string }
  | { t: "ia/descartar"; prospectoId: string }
  | { t: "tarea/hecha"; tareaId: string }
  | { t: "gestion/avanzar"; gestionId: string }
  | { t: "cuota/pagar"; cuotaId: string; medio: string }
  | { t: "cuota/recordar"; cuotaId: string }
  | { t: "cuota/promesa"; cuotaId: string; fecha: string }
  | { t: "cuota/mora"; cuotaId: string; nivel: NivelMora }
  | { t: "ui/movil"; movil: boolean }
  | { t: "lead/nuevo"; nombre: string; telefono: string; ramo: Ramo; bien: string }
  | { t: "lead/cotizar"; leadId: string; aseguradora: string; plan: string; precio: number }
  | { t: "cliente/elegirOferta"; clienteId: string; ramo: Ramo; bien: string; aseguradora: string; plan: string; precio: number }
  | { t: "renovacion/recotizar"; polizaId: string; propuesta: number }
  | { t: "gestion/check"; gestionId: string; i: number }
  | { t: "gestion/tomar"; gestionId: string }
  | { t: "gestion/rechazar"; gestionId: string }
  | { t: "gestion/pedirDocs"; gestionId: string }
  | { t: "mensaje/enviar"; clienteId: string; de: Mensaje["de"]; texto: string }
  | { t: "cobranza/llamada"; clienteId: string; resultado: "Atendió" | "Promesa de pago" | "No atendió" }
  | { t: "cobranza/recordatorioMasivo"; nivel: "temprana" | "tardia" }
  | { t: "plan/crear"; clienteId: string; cuotas: number }
  | { t: "doc/subir"; clienteId: string; nombre: string }
  | { t: "cliente/nota"; clienteId: string; texto: string }
  | { t: "lead/plan"; leadId: string; aseguradora: string; plan: string; precio: number }
  | { t: "cotizacion/nueva"; clienteId: string; ramo: Ramo; bien: string; aseguradora: string; plan: string; precio: number };

const diasAtraso = (vence: string, hoy: string) => Math.round((Date.parse(hoy) - Date.parse(vence)) / 86_400_000);

/** Prima mensual estimada por ramo, para los leads nuevos */
const PRIMA_ESTIMADA: Record<Ramo, number> = { Auto: 45_000, Hogar: 22_000, Vida: 14_000, Comercio: 58_000, "Accidentes personales": 9_500 };

function reducer(prev: Estado | null, a: Accion): Estado | null {
  if (a.t === "init") return seed(a.hoy);
  if (!prev) return prev;
  if (a.t === "reset") return seed(prev.hoy);

  // Copia superficial de las listas: cada acción devuelve un estado nuevo
  const s: Estado = {
    ...prev,
    clientes: [...prev.clientes],
    leads: [...prev.leads],
    polizas: [...prev.polizas],
    gestiones: [...prev.gestiones],
    cuotas: [...prev.cuotas],
    tareas: [...prev.tareas],
    prospectos: [...prev.prospectos],
    eventos: [...prev.eventos],
    mensajes: [...prev.mensajes],
    planes: [...prev.planes],
    documentos: [...prev.documentos],
  };
  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
  const hoy = s.hoy;
  const id = (p: string) => `${p}${++s.seq}`;
  const evento = (para: Rol, texto: string, clienteId?: string) => s.eventos.push({ id: id("e"), fecha: hoy, para, texto, clienteId });
  const nombreDe = (clienteId: string) => getCliente(s, clienteId).nombre;
  const primerNombre = (clienteId: string) => nombreDe(clienteId).split(" ")[0];
  const editar = <T extends { id: string }>(lista: T[], key: string, cambio: (x: T) => T) => {
    const i = lista.findIndex((x) => x.id === key);
    if (i >= 0) lista[i] = cambio(lista[i]);
    return lista[i];
  };
  const nuevaTarea = (clienteId: string, tipo: Tarea["tipo"], detalle: string, dias = 0) => {
    const ya = s.tareas.some((t) => t.clienteId === clienteId && t.tipo === tipo && !t.hecha);
    if (!ya) s.tareas.push({ id: id("t"), clienteId, asesorId: getCliente(s, clienteId).asesorId, tipo, fecha: addDays(hoy, dias), detalle, hecha: false });
  };
  const nuevoLead = (clienteId: string, ramo: Ramo, bien: string, origen: Lead["origen"], notas: string[] = []) => {
    s.leads.push({
      id: id("l"),
      clienteId,
      ramo,
      bien,
      etapa: "Nueva",
      contacto: "Sin contactar",
      prima: PRIMA_ESTIMADA[ramo],
      proxAccion: "Primer llamado",
      proxFecha: hoy,
      origen,
      creado: hoy,
      notas: notas.map((texto) => ({ fecha: hoy, texto })),
    });
  };
  const pagar = (cuotaId: string, medio: string, quien: "cliente" | "cobranzas") => {
    const c = editar(s.cuotas, cuotaId, (c) => ({ ...c, pagada: hoy, medio, historial: [...c.historial, { fecha: hoy, texto: `Pago registrado · ${medio}` }] }));
    if (!c) return;
    const pol = s.polizas.find((p) => p.id === c.polizaId)!;
    if (quien === "cliente") evento("cobranzas", `${nombreDe(c.clienteId)} pagó la cuota ${c.nro} de ${pol.ramo} con ${medio}. Ya figura como pagada.`);
    else evento("cliente", `Registramos tu pago de la cuota ${c.nro} de ${pol.ramo}. ¡Gracias!`, c.clienteId);
    // Si ya no debe nada vencido, se cierra la tarea de deuda del asesor
    const debe = s.cuotas.some((q) => q.clienteId === c.clienteId && !q.pagada && q.vence < hoy);
    if (!debe) {
      const abierta = s.tareas.find((t) => t.clienteId === c.clienteId && t.tipo === "Deuda" && !t.hecha);
      if (abierta) {
        editar(s.tareas, abierta.id, (t) => ({ ...t, hecha: true }));
        evento("asesor", `${nombreDe(c.clienteId)} regularizó su deuda: cerramos la tarea de seguimiento.`);
      }
    }
  };

  switch (a.t) {
    case "cliente/elegir":
      s.clienteActual = a.id;
      return s;

    case "cliente/alta": {
      const asesorId = asesorConMenosCarga(s);
      const cid = id("c");
      s.clientes.push({ id: cid, nombre: a.nombre, dni: a.dni, telefono: a.telefono, email: a.email, ciudad: a.ciudad, asesorId, origen: "Autogestión", desde: hoy });
      nuevoLead(cid, a.ramo, a.bien, "Autogestión", ["Se dio de alta desde la autogestión"]);
      s.clienteActual = cid;
      s.asesorActual = asesorId;
      const asesor = s.asesores.find((x) => x.id === asesorId)!;
      evento("asesor", `Alta nueva desde la autogestión: ${a.nombre} quiere asegurar su ${a.ramo.toLowerCase()}. Se le asignó a ${asesor.nombre} por tener menos carga.`);
      return s;
    }

    case "cliente/cotizar":
      nuevoLead(a.clienteId, a.ramo, a.bien, "Autogestión", ["Pidió la cotización desde la autogestión"]);
      evento("asesor", `${nombreDe(a.clienteId)} pidió cotizar ${a.ramo.toLowerCase()} desde la autogestión: ya está en tus oportunidades como lead nuevo.`);
      return s;

    case "cliente/pagar":
      pagar(a.cuotaId, a.medio, "cliente");
      return s;

    case "cliente/siniestro": {
      const pol = s.polizas.find((p) => p.id === a.polizaId)!;
      s.gestiones.push({
        id: id("g"),
        tipo: "Siniestro",
        clienteId: pol.clienteId,
        polizaId: pol.id,
        ramo: pol.ramo,
        detalle: `${a.que} · ${a.cuando}. ${a.descripcion}`.trim(),
        paso: 0,
        creada: hoy,
        vence: addDays(hoy, 3),
        historial: [{ fecha: hoy, texto: "Denuncia cargada por el cliente desde la autogestión" }],
        checks: [true, false, false, false],
        relato: a.descripcion,
        monto: Math.round((pol.suma * 0.04) / 1000) * 1000,
      });
      s.documentos.push({ id: id("d"), clienteId: pol.clienteId, nombre: `Denuncia de siniestro · ${a.que.toLowerCase()}`, tipo: "Denuncia", fecha: hoy });
      nuevaTarea(pol.clienteId, "Post-siniestro", `Acompañar a ${primerNombre(pol.clienteId)} con su siniestro de ${pol.ramo.toLowerCase()}: llamarlo hoy`);
      evento("admin", `Nueva denuncia de siniestro de ${nombreDe(pol.clienteId)} (${pol.ramo}). Está en tu bandeja.`);
      evento("asesor", `${nombreDe(pol.clienteId)} denunció un siniestro: te dejamos una tarea para acompañarlo.`);
      return s;
    }

    case "cliente/mensaje":
      s.mensajes.push({ id: id("m"), clienteId: a.clienteId, de: "cliente", texto: a.texto, fecha: hoy, hora });
      evento("asesor", `Mensaje de ${nombreDe(a.clienteId)}: "${a.texto}"`);
      return s;

    case "asesor/elegir":
      s.asesorActual = a.id;
      return s;

    case "lead/etapa": {
      const l = editar(s.leads, a.leadId, (l) => ({ ...l, etapa: a.etapa, notas: [...l.notas, { fecha: hoy, texto: `Pasó a ${a.etapa}` }] }));
      if (l && a.etapa === "Ganada" && !s.gestiones.some((g) => g.leadId === l.id)) {
        s.gestiones.push({
          id: id("g"),
          tipo: "Emisión",
          clienteId: l.clienteId,
          leadId: l.id,
          ramo: l.ramo,
          detalle: `${l.bien} · cotización aceptada por ${primerNombre(l.clienteId)}`,
          paso: 0,
          creada: hoy,
          vence: addDays(hoy, 2),
          historial: [{ fecha: hoy, texto: "El asesor ganó la oportunidad" }],
          checks: CHECKLIST["Emisión"].map(() => false),
        });
        editar(s.leads, l.id, (x) => ({ ...x, proxAccion: "Esperando la póliza", proxFecha: addDays(hoy, 2) }));
        evento("admin", `Emisión nueva: ${nombreDe(l.clienteId)} aceptó su seguro de ${l.ramo.toLowerCase()}. Está en tu bandeja.`);
      }
      return s;
    }

    case "lead/contacto": {
      const proxima: Record<Lead["contacto"], [string, number]> = {
        "Sin contactar": ["Primer llamado", 0],
        Contactado: ["Esperar respuesta", 1],
        Respondió: ["Enviar cotización", 1],
        "No responde": ["Reintentar por WhatsApp", 2],
      };
      const [proxAccion, dias] = proxima[a.contacto];
      editar(s.leads, a.leadId, (l) => ({
        ...l,
        contacto: a.contacto,
        etapa: l.etapa === "Nueva" && a.contacto !== "Sin contactar" ? "Contactada" : l.etapa,
        proxAccion,
        proxFecha: addDays(hoy, dias),
        notas: [...l.notas, { fecha: hoy, texto: `Contacto: ${a.contacto}` }],
      }));
      return s;
    }

    case "lead/nota":
      editar(s.leads, a.leadId, (l) => ({ ...l, notas: [...l.notas, { fecha: hoy, texto: a.texto }] }));
      return s;

    case "ia/buscar": {
      const usados = new Set(s.prospectos.map((p) => p.nombre));
      PROSPECTOS_POOL.filter((p) => !usados.has(p.nombre))
        .slice(0, 4)
        .forEach((p) => s.prospectos.push({ ...p, id: id("x"), estado: "nuevo" }));
      return s;
    }

    case "ia/agregar": {
      const p = editar(s.prospectos, a.prospectoId, (p) => ({ ...p, estado: "agregado" as const }));
      if (!p) return s;
      const cid = id("c");
      s.clientes.push({ id: cid, nombre: p.nombre, dni: "Sin cargar", telefono: p.telefono, email: p.email, ciudad: p.ciudad, asesorId: s.asesorActual, origen: "Prospección IA", desde: hoy });
      nuevoLead(cid, p.ramo, p.bien, "Prospección IA", [`Señal detectada: ${p.senal} (${p.fuente})`]);
      return s;
    }

    case "ia/descartar":
      editar(s.prospectos, a.prospectoId, (p) => ({ ...p, estado: "descartado" as const }));
      return s;

    case "tarea/hecha":
      editar(s.tareas, a.tareaId, (t) => ({ ...t, hecha: true }));
      return s;

    case "gestion/avanzar": {
      const g = s.gestiones.find((x) => x.id === a.gestionId);
      if (!g) return s;
      const pasos = PASOS[g.tipo];
      if (g.paso >= pasos.length - 1) return s;
      const paso = g.paso + 1;
      const final = paso === pasos.length - 1;
      editar(s.gestiones, g.id, (x) => ({ ...x, paso, historial: [...x.historial, { fecha: hoy, texto: pasos[paso] }] }));
      if (!final) return s;

      const quien = nombreDe(g.clienteId);
      if (g.tipo === "Emisión") {
        const lead = s.leads.find((l) => l.id === g.leadId);
        const pid = id("p");
        const prima = lead?.prima ?? PRIMA_ESTIMADA[g.ramo];
        s.polizas.push({
          id: pid,
          numero: `BF-${40_000 + s.seq * 7}`,
          clienteId: g.clienteId,
          ramo: g.ramo,
          aseguradora: lead?.cotizacion?.aseguradora ?? ASEGURADORAS[s.seq % ASEGURADORAS.length],
          bien: lead?.bien ?? g.detalle,
          desde: hoy,
          hasta: addMonths(hoy, 12),
          prima,
          suma: prima * 380,
        });
        s.cuotas.push({ id: id("q"), polizaId: pid, clienteId: g.clienteId, nro: 1, vence: addDays(hoy, 10), monto: prima, historial: [] });
        if (lead) editar(s.leads, lead.id, (l) => ({ ...l, proxAccion: "Póliza emitida", proxFecha: hoy }));
        nuevaTarea(g.clienteId, "Bienvenida", `Darle la bienvenida a ${primerNombre(g.clienteId)} y explicarle su póliza de ${g.ramo.toLowerCase()}`, 1);
        evento("cliente", `¡Tu póliza de ${g.ramo.toLowerCase()} ya está emitida! La primera cuota vence en 10 días.`, g.clienteId);
        evento("cobranzas", `Póliza nueva de ${quien} (${g.ramo}): la cuota 1 ya está en tu calendario de cobro.`);
        evento("asesor", `Se emitió la póliza de ${quien}: te dejamos una tarea para darle la bienvenida.`);
      } else if (g.tipo === "Siniestro") {
        evento("cliente", `Tu siniestro de ${g.ramo.toLowerCase()} fue liquidado por la aseguradora.`, g.clienteId);
        evento("asesor", `Se liquidó el siniestro de ${quien}: buen momento para preguntarle cómo vivió el proceso.`);
      } else if (g.tipo === "Renovación" && g.polizaId) {
        editar(s.polizas, g.polizaId, (p) => ({ ...p, hasta: addMonths(p.hasta, 12) }));
        evento("cliente", `Renovamos tu seguro de ${g.ramo.toLowerCase()} por 12 meses más.`, g.clienteId);
      } else if (g.tipo === "Endoso") {
        evento("cliente", `Aplicamos el cambio que pediste en tu póliza de ${g.ramo.toLowerCase()}.`, g.clienteId);
      } else if (g.tipo === "Baja" && g.polizaId) {
        editar(s.polizas, g.polizaId, (p) => ({ ...p, hasta: addDays(hoy, -1) }));
        evento("asesor", `Se dio de baja la póliza de ${g.ramo.toLowerCase()} de ${quien}.`);
      }
      return s;
    }

    case "cuota/pagar":
      pagar(a.cuotaId, a.medio, "cobranzas");
      return s;

    case "cuota/recordar": {
      const c = editar(s.cuotas, a.cuotaId, (c) => ({ ...c, historial: [...c.historial, { fecha: hoy, texto: "Recordatorio enviado por WhatsApp" }] }));
      if (c) evento("cliente", `Te recordamos que tenés pendiente la cuota ${c.nro}. Podés pagarla desde acá.`, c.clienteId);
      return s;
    }

    case "cuota/promesa":
      editar(s.cuotas, a.cuotaId, (c) => ({ ...c, promesa: a.fecha, historial: [...c.historial, { fecha: hoy, texto: `Promesa de pago para el ${a.fecha.split("-").reverse().slice(0, 2).join("/")}` }] }));
      return s;

    case "ui/movil":
      s.movil = a.movil;
      return s;

    case "lead/nuevo": {
      const cid = id("c");
      s.clientes.push({ id: cid, nombre: a.nombre, dni: "Sin cargar", telefono: a.telefono, email: "", ciudad: "La Plata", asesorId: s.asesorActual, origen: "Referido", desde: hoy });
      nuevoLead(cid, a.ramo, a.bien, "Referido", ["Lead cargado a mano por el asesor"]);
      return s;
    }

    case "lead/cotizar": {
      const l = editar(s.leads, a.leadId, (l) => ({
        ...l,
        etapa: ["Nueva", "Contactada"].includes(l.etapa) ? "Cotizada" : l.etapa,
        prima: a.precio,
        cotizacion: { aseguradora: a.aseguradora, plan: a.plan, precio: a.precio },
        proxAccion: "Seguimiento de la cotización",
        proxFecha: addDays(hoy, 2),
        notas: [...l.notas, { fecha: hoy, texto: `Cotización enviada por WhatsApp: ${a.aseguradora} · ${a.plan}` }],
      }));
      if (l) evento("cliente", `Tu asesora te envió una propuesta de ${l.ramo.toLowerCase()}: ${a.aseguradora}, ${a.plan}.`, l.clienteId);
      return s;
    }

    case "cliente/elegirOferta":
      s.leads.push({
        id: id("l"),
        clienteId: a.clienteId,
        ramo: a.ramo,
        bien: a.bien,
        etapa: "Negociación",
        contacto: "Respondió",
        prima: a.precio,
        proxAccion: "Confirmar y pasar a emisión",
        proxFecha: hoy,
        origen: "Autogestión",
        creado: hoy,
        cotizacion: { aseguradora: a.aseguradora, plan: a.plan, precio: a.precio },
        notas: [{ fecha: hoy, texto: `Eligió ${a.aseguradora} · ${a.plan} desde la autogestión` }],
      });
      evento("asesor", `${nombreDe(a.clienteId)} eligió ${a.aseguradora} (${a.plan}) para su ${a.ramo.toLowerCase()} desde la autogestión: confirmalo y pasalo a emisión.`);
      return s;

    case "renovacion/recotizar": {
      const pol = s.polizas.find((p) => p.id === a.polizaId);
      if (!pol || s.gestiones.some((g) => g.polizaId === pol.id && g.tipo === "Renovación" && g.paso < PASOS["Renovación"].length - 1)) return s;
      s.gestiones.push({
        id: id("g"),
        tipo: "Renovación",
        clienteId: pol.clienteId,
        polizaId: pol.id,
        ramo: pol.ramo,
        detalle: `Renovar con ${pol.aseguradora}: propuesta de $ ${a.propuesta.toLocaleString("es-AR")} por mes`,
        paso: 0,
        creada: hoy,
        vence: addDays(hoy, 4),
        historial: [{ fecha: hoy, texto: "El asesor recotizó la renovación" }],
        checks: [true, false, false],
      });
      evento("admin", `Renovación para gestionar: ${nombreDe(pol.clienteId)} (${pol.ramo}). El asesor ya la recotizó.`);
      return s;
    }

    case "gestion/check":
      editar(s.gestiones, a.gestionId, (g) => ({ ...g, checks: g.checks.map((c, k) => (k === a.i ? !c : c)) }));
      return s;

    case "gestion/tomar":
      editar(s.gestiones, a.gestionId, (g) => ({ ...g, responsable: "Julián Sosa", historial: [...g.historial, { fecha: hoy, texto: "Julián Sosa tomó el trámite" }] }));
      return s;

    case "gestion/rechazar": {
      const g = editar(s.gestiones, a.gestionId, (g) => ({ ...g, rechazada: true, historial: [...g.historial, { fecha: hoy, texto: "Rechazado por administración" }] }));
      if (g) evento("cliente", `No pudimos aplicar el cambio que pediste en tu póliza de ${g.ramo.toLowerCase()}. Tu asesora te va a contar por qué.`, g.clienteId);
      return s;
    }

    case "gestion/pedirDocs": {
      const g = editar(s.gestiones, a.gestionId, (g) => ({ ...g, historial: [...g.historial, { fecha: hoy, texto: "Se pidió documentación al cliente" }] }));
      if (g) {
        const faltan = CHECKLIST[g.tipo].filter((_, k) => !g.checks[k]);
        evento("cliente", `Para avanzar con tu ${g.tipo.toLowerCase()} de ${g.ramo.toLowerCase()} necesitamos: ${faltan.join(", ").toLowerCase() || "un último dato"}.`, g.clienteId);
      }
      return s;
    }

    case "mensaje/enviar":
      s.mensajes.push({ id: id("m"), clienteId: a.clienteId, de: a.de, texto: a.texto, fecha: hoy, hora });
      if (a.de === "cliente") evento("asesor", `Mensaje de ${nombreDe(a.clienteId)}: "${a.texto}"`);
      else evento("cliente", a.de === "cobranzas" ? `Cobranzas te escribió: "${a.texto}"` : `Tu asesora te escribió: "${a.texto}"`, a.clienteId);
      return s;

    case "cobranza/llamada": {
      s.cuotas
        .filter((q) => q.clienteId === a.clienteId && !q.pagada && !q.planId && q.vence < hoy)
        .forEach((q) =>
          editar(s.cuotas, q.id, (c) => ({
            ...c,
            promesa: a.resultado === "Promesa de pago" ? addDays(hoy, 3) : c.promesa,
            historial: [...c.historial, { fecha: hoy, texto: `Llamada · ${a.resultado}` }],
          })),
        );
      return s;
    }

    case "cobranza/recordatorioMasivo": {
      const clientes = new Set<string>();
      s.cuotas
        .filter((q) => !q.pagada && !q.planId && q.vence < hoy && (a.nivel === "tardia" ? diasAtraso(q.vence, hoy) > 30 : diasAtraso(q.vence, hoy) <= 30))
        .forEach((q) => {
          clientes.add(q.clienteId);
          editar(s.cuotas, q.id, (c) => ({ ...c, historial: [...c.historial, { fecha: hoy, texto: "Recordatorio masivo por WhatsApp" }] }));
        });
      clientes.forEach((cid) => evento("cliente", "Te recordamos que tenés cuotas vencidas. Podés pagarlas desde acá en un minuto.", cid));
      return s;
    }

    case "plan/crear": {
      const deuda = s.cuotas.filter((q) => q.clienteId === a.clienteId && !q.pagada && !q.planId && q.vence < hoy);
      if (!deuda.length) return s;
      const total = deuda.reduce((t, q) => t + q.monto, 0);
      const recargo = recargoPlan(a.cuotas);
      const conRecargo = Math.round(total * (1 + recargo / 100));
      const pid = id("pl");
      s.planes.push({
        id: pid,
        clienteId: a.clienteId,
        deuda: total,
        recargo,
        creado: hoy,
        cuotas: Array.from({ length: a.cuotas }, (_, k) => ({ n: k + 1, fecha: addMonths(addDays(hoy, 7), k), monto: Math.round(conRecargo / a.cuotas) })),
      });
      deuda.forEach((q) => editar(s.cuotas, q.id, (c) => ({ ...c, planId: pid, mora: undefined, historial: [...c.historial, { fecha: hoy, texto: `Refinanciada en un plan de ${a.cuotas} cuotas` }] })));
      const abierta = s.tareas.find((t) => t.clienteId === a.clienteId && t.tipo === "Deuda" && !t.hecha);
      if (abierta) editar(s.tareas, abierta.id, (t) => ({ ...t, hecha: true }));
      evento("cliente", `Te armamos un plan de pago de ${a.cuotas} cuotas para que no pierdas tu cobertura. La primera vence en 7 días.`, a.clienteId);
      evento("asesor", `${nombreDe(a.clienteId)} refinanció su deuda en ${a.cuotas} cuotas: su cobertura sigue activa.`);
      return s;
    }

    case "cotizacion/nueva":
      s.leads.push({
        id: id("l"),
        clienteId: a.clienteId,
        ramo: a.ramo,
        bien: a.bien,
        etapa: "Cotizada",
        contacto: "Contactado",
        prima: a.precio,
        proxAccion: "Seguimiento de la cotización",
        proxFecha: addDays(hoy, 2),
        origen: getCliente(s, a.clienteId).origen,
        creado: hoy,
        cotizacion: { aseguradora: a.aseguradora, plan: a.plan, precio: a.precio },
        notas: [{ fecha: hoy, texto: `Cotización enviada por WhatsApp: ${a.aseguradora} · ${a.plan}` }],
      });
      evento("cliente", `Tu asesora te envió una propuesta de ${a.ramo.toLowerCase()}: ${a.aseguradora}, ${a.plan}.`, a.clienteId);
      return s;

    case "lead/plan":
      editar(s.leads, a.leadId, (l) => ({ ...l, prima: a.precio, cotizacion: { aseguradora: a.aseguradora, plan: a.plan, precio: a.precio } }));
      return s;

    case "cliente/nota":
      editar(s.clientes, a.clienteId, (c) => ({ ...c, notas: [...(c.notas ?? []), { fecha: hoy, texto: a.texto }] }));
      return s;

    case "doc/subir":
      s.documentos.push({ id: id("d"), clienteId: a.clienteId, nombre: a.nombre, tipo: "Fotos", fecha: hoy });
      return s;

    case "cuota/mora": {
      const c = editar(s.cuotas, a.cuotaId, (c) => ({ ...c, mora: a.nivel, historial: [...c.historial, { fecha: hoy, texto: `Pasó a mora ${a.nivel === "tardia" ? "tardía" : "temprana"}` }] }));
      if (!c) return s;
      const tardia = a.nivel === "tardia";
      evento("cliente", tardia ? "Tenés cuotas con más de 30 días de atraso: tu cobertura puede suspenderse. Regularizá desde acá." : `Tu cuota ${c.nro} está vencida. Pagala desde acá para seguir cubierto.`, c.clienteId);
      nuevaTarea(c.clienteId, "Deuda", `${primerNombre(c.clienteId)} está en mora ${tardia ? "tardía" : "temprana"}: llamarlo para entender qué le pasa`);
      evento("asesor", `${nombreDe(c.clienteId)} pasó a mora ${tardia ? "tardía" : "temprana"}: te dejamos una tarea para acompañarlo.`);
      return s;
    }
  }
}

interface Demo {
  s: Estado | null;
  dispatch: (a: Accion) => void;
}

const Ctx = createContext<Demo | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, null);
  // Se arma en el navegador con la fecha de hoy, así no difiere entre servidor y cliente
  useEffect(() => dispatch({ t: "init", hoy: isoDate(new Date()) }), []);
  return <Ctx.Provider value={{ s, dispatch }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemo fuera de DemoProvider");
  return ctx;
}
