"use client";

/** Pipeline de leads: cada oportunidad avanza por etapas con su próxima acción. */
import Link from "next/link";
import { useState } from "react";
import { RamoTile } from "@/components/ramo";
import { Badge, Button, Card, Chip, Field, Icon, Loading, Modal, PageHeader, Segmented, cx, inputClass } from "@/components/ui";
import { daysBetween, fmtFecha, fmtPesos, relativo } from "@/lib/format";
import { cliente } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { CONTACTOS, RAMOS, type Estado, type Etapa, type Lead, type Ramo } from "@/lib/types";

const COLUMNAS: Etapa[] = ["Nueva", "Contactada", "Cotizada", "Negociación", "Ganada"];
const SIGUIENTE: Partial<Record<Etapa, [Etapa, string]>> = {
  Nueva: ["Contactada", "Contactar"],
  Contactada: ["Cotizada", "Cotizar"],
  Cotizada: ["Negociación", "Negociar"],
  Negociación: ["Ganada", "Ganar"],
};

/** Un lead nuevo o contactado que lleva 5 días o más sin novedades se marca en rojo */
export const enRiesgo = (l: Lead, hoy: string) => ["Nueva", "Contactada"].includes(l.etapa) && daysBetween(l.notas.at(-1)?.fecha ?? l.creado, hoy) >= 5;

export function Pipeline() {
  const { s, dispatch } = useDemo();
  const [ramo, setRamo] = useState<Ramo | "Todos">("Todos");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [perdidas, setPerdidas] = useState(false);
  if (!s) return <Loading />;

  const mios = s.leads.filter((l) => cliente(s, l.clienteId).asesorId === s.asesorActual);
  const visibles = mios.filter((l) => ramo === "Todos" || l.ramo === ramo);
  const abiertas = mios.filter((l) => !["Ganada", "Perdida"].includes(l.etapa));
  const lead = abierto ? s.leads.find((l) => l.id === abierto) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pipeline de leads"
        subtitle={`${abiertas.length} oportunidades abiertas · ${fmtPesos(abiertas.reduce((t, l) => t + l.prima, 0))} en primas mensuales`}
      >
        <label className="flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-muted">
          Cartera de
          <select className={cx(inputClass, "h-10 w-auto py-0")} value={s.asesorActual} onChange={(e) => dispatch({ t: "asesor/elegir", id: e.target.value })}>
            {s.asesores.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </label>
        <Button icon="add" onClick={() => setNuevo(true)}>Nuevo lead</Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Chip active={ramo === "Todos"} onClick={() => setRamo("Todos")}>Todos</Chip>
        {RAMOS.map((r) => (
          <Chip key={r} active={ramo === r} onClick={() => setRamo(r)} count={mios.filter((l) => l.ramo === r && l.etapa !== "Perdida").length}>
            {r}
          </Chip>
        ))}
        <button onClick={() => setPerdidas(!perdidas)} className="ml-auto text-[13px] font-semibold text-muted hover:text-ink">
          {perdidas ? "Ocultar" : "Ver"} perdidas ({mios.filter((l) => l.etapa === "Perdida").length})
        </button>
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {(perdidas ? [...COLUMNAS, "Perdida" as Etapa] : COLUMNAS).map((etapa) => {
          const cards = visibles.filter((l) => l.etapa === etapa);
          return (
            <section key={etapa} aria-label={etapa} className="flex w-[272px] shrink-0 flex-col gap-2.5 rounded-2xl bg-segment/70 p-2.5">
              <div className="flex items-center justify-between px-1.5 pt-1">
                <span className="flex items-center gap-2 text-sm font-bold">
                  {etapa}
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface px-1.5 text-xs text-muted">{cards.length}</span>
                </span>
                <span className="text-xs font-semibold text-muted">{fmtPesos(cards.reduce((t, l) => t + l.prima, 0))}</span>
              </div>
              {cards.length === 0 && <p className="px-2 py-6 text-center text-xs text-faint">Sin oportunidades</p>}
              {cards.map((l) => (
                <LeadCard key={l.id} s={s} lead={l} onOpen={() => setAbierto(l.id)} />
              ))}
            </section>
          );
        })}
      </div>

      {lead && <LeadModal s={s} lead={lead} onClose={() => setAbierto(null)} />}
      {nuevo && <NuevoLead onClose={() => setNuevo(false)} />}
    </div>
  );
}

function LeadCard({ s, lead, onOpen }: { s: Estado; lead: Lead; onOpen: () => void }) {
  const { dispatch } = useDemo();
  const c = cliente(s, lead.clienteId);
  const next = SIGUIENTE[lead.etapa];
  const riesgo = enRiesgo(lead, s.hoy);
  const emitida = lead.proxAccion === "Póliza emitida";
  return (
    <Card className={cx("flex flex-col gap-3 p-3.5", riesgo && "border-danger/50")}>
      <div className="flex gap-2.5">
        <RamoTile ramo={lead.ramo} size={36} />
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block max-w-full truncate text-left text-sm font-bold hover:text-primary">
            {c.nombre}
          </button>
          <span className="block truncate text-xs text-muted">{lead.ramo} · {lead.bien}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-extrabold">
          {fmtPesos(lead.prima)}
          <span className="text-xs font-medium text-faint"> /mes</span>
        </span>
        <Badge tone={lead.origen === "Prospección IA" ? "primary" : lead.origen === "Autogestión" ? "info" : "neutral"} icon={lead.origen === "Prospección IA" ? "auto_awesome" : undefined}>
          {lead.origen}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
        <span className={cx("flex items-center gap-1 text-xs font-semibold", riesgo ? "text-on-danger" : "text-muted")}>
          <Icon name={riesgo ? "error" : "schedule"} size={15} />
          {riesgo ? `${daysBetween(lead.notas.at(-1)?.fecha ?? lead.creado, s.hoy)} días sin contacto` : lead.contacto === "Sin contactar" ? "Sin contactar" : relativo(lead.creado, s.hoy).replace("hace", "Hace")}
        </span>
        {next && (
          <button onClick={() => dispatch({ t: "lead/etapa", leadId: lead.id, etapa: next[0] })} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-soft">
            {next[1]} <Icon name="arrow_forward" size={15} />
          </button>
        )}
        {lead.etapa === "Ganada" && <Badge tone={emitida ? "ok" : "info"}>{emitida ? "Póliza emitida" : "En emisión"}</Badge>}
      </div>
    </Card>
  );
}

function LeadModal({ s, lead, onClose }: { s: Estado; lead: Lead; onClose: () => void }) {
  const { dispatch } = useDemo();
  const c = cliente(s, lead.clienteId);
  const [nota, setNota] = useState("");
  const abierta = !["Ganada", "Perdida"].includes(lead.etapa);
  return (
    <Modal title={c.nombre} onClose={onClose} wide>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          <Badge tone="primary">{lead.etapa}</Badge>
          <span>{lead.ramo} · {lead.bien}</span>
          <span>· {c.telefono}</span>
          {c.email && <span>· {c.email}</span>}
        </div>
        {lead.cotizacion && (
          <div className="rounded-xl bg-primary-soft p-3 text-sm text-primary-hover">
            Propuesta: <strong>{lead.cotizacion.aseguradora}</strong> · {lead.cotizacion.plan} · {fmtPesos(lead.cotizacion.precio)}/mes
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-2">Estado del contacto</span>
          <Segmented label="Estado del contacto" value={lead.contacto} onChange={(v) => dispatch({ t: "lead/contacto", leadId: lead.id, contacto: v })} options={CONTACTOS.map((x) => ({ value: x, label: x }))} />
          <span className="text-xs text-muted">Próxima acción: <strong className="text-ink">{lead.proxAccion}</strong> · {fmtFecha(lead.proxFecha)}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-2">Historial</span>
          <ol className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {[...lead.notas].reverse().map((n, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="w-14 shrink-0 text-xs text-faint">{fmtFecha(n.fecha)}</span>
                <span>{n.texto}</span>
              </li>
            ))}
          </ol>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!nota.trim()) return;
              dispatch({ t: "lead/nota", leadId: lead.id, texto: nota.trim() });
              setNota("");
            }}
          >
            <input className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Lo llamé, pide cotizar con granizo" aria-label="Nueva nota" />
            <Button type="submit" variant="secondary">Anotar</Button>
          </form>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {abierta && <Button variant="danger" onClick={() => { dispatch({ t: "lead/etapa", leadId: lead.id, etapa: "Perdida" }); onClose(); }}>Marcar perdida</Button>}
          <Link href={`/asesor/cliente?id=${c.id}`} className="inline-flex h-10 items-center rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-bg">Ver ficha</Link>
          {abierta && (
            <Link href={`/asesor/cotizador?lead=${lead.id}`} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
              <Icon name="request_quote" /> Cotizar
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}

function NuevoLead({ onClose }: { onClose: () => void }) {
  const { dispatch } = useDemo();
  const [f, setF] = useState({ nombre: "", telefono: "", ramo: "Auto" as Ramo, bien: "" });
  const [error, setError] = useState("");
  return (
    <Modal title="Nuevo lead" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (f.nombre.trim().length < 3) return setError("Escribí el nombre del cliente o del comercio.");
          if (f.telefono.replace(/\D/g, "").length < 8) return setError("Revisá el teléfono: al menos 8 números.");
          dispatch({ t: "lead/nuevo", ...f, nombre: f.nombre.trim(), bien: f.bien.trim() || f.ramo });
          onClose();
        }}
      >
        <Field label="Nombre o comercio">
          <input className={inputClass} value={f.nombre} onChange={(e) => { setF({ ...f, nombre: e.target.value }); setError(""); }} placeholder="Carolina Ruiz" />
        </Field>
        <Field label="Celular">
          <input className={inputClass} inputMode="tel" value={f.telefono} onChange={(e) => { setF({ ...f, telefono: e.target.value }); setError(""); }} placeholder="221 555-1234" />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="Ramo">
            <select className={inputClass} value={f.ramo} onChange={(e) => setF({ ...f, ramo: e.target.value as Ramo })}>
              {RAMOS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Qué asegura" hint="Opcional">
            <input className={inputClass} value={f.bien} onChange={(e) => setF({ ...f, bien: e.target.value })} placeholder="Toyota Corolla 2021" />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-on-danger">{error}</p>}
        <Button type="submit">Crear lead</Button>
      </form>
    </Modal>
  );
}
