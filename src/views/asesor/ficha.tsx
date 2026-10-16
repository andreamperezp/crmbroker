"use client";

/** Ficha de cliente: todo lo que el asesor necesita saber antes de llamar. */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ICONO_RAMO, RamoTile } from "@/components/ramo";
import { Avatar, Badge, Button, Card, Field, Icon, IconTile, Loading, Modal, cx, inputClass } from "@/components/ui";
import { fmtFecha, fmtFechaLarga, fmtPesos, parseISO } from "@/lib/format";
import { deudaDe, estadoPoliza } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS, type Estado, type Ramo } from "@/lib/types";

/** Venta cruzada: qué le falta asegurar según lo que ya tiene */
function oportunidades(s: Estado, clienteId: string): { ramo: Ramo; motivo: string }[] {
  const tiene = new Set(s.polizas.filter((p) => p.clienteId === clienteId).map((p) => p.ramo));
  const enCurso = new Set(s.leads.filter((l) => l.clienteId === clienteId && l.etapa !== "Perdida").map((l) => l.ramo));
  const ideas: { ramo: Ramo; motivo: string }[] = [];
  if (tiene.has("Auto") && !tiene.has("Hogar")) ideas.push({ ramo: "Hogar", motivo: "Asegura su auto pero no su casa: suele ser la segunda póliza más fácil de sumar." });
  if (!tiene.has("Vida") && (tiene.has("Hogar") || tiene.has("Auto"))) ideas.push({ ramo: "Vida", motivo: "No tiene seguro de vida. Buen tema para la próxima conversación de renovación." });
  if (tiene.has("Comercio") && !tiene.has("Accidentes personales")) ideas.push({ ramo: "Accidentes personales", motivo: "Tiene un comercio: puede cubrir a quienes trabajan en el local." });
  if (tiene.has("Accidentes personales") && !tiene.has("Vida")) ideas.push({ ramo: "Vida", motivo: "Trabaja de forma independiente: un seguro de vida protege a su familia." });
  return ideas.filter((i) => !enCurso.has(i.ramo)).slice(0, 3);
}

export function Ficha() {
  const { s, dispatch } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const [modal, setModal] = useState<null | "wa" | "nota">(null);
  if (!s) return <Loading />;

  const mios = s.clientes.filter((c) => c.asesorId === s.asesorActual && (s.polizas.some((p) => p.clienteId === c.id) || s.leads.some((l) => l.clienteId === c.id)));
  const id = params.get("id") && s.clientes.some((c) => c.id === params.get("id")) ? params.get("id")! : (mios.find((c) => s.polizas.some((p) => p.clienteId === c.id))?.id ?? mios[0]?.id);
  const c = s.clientes.find((x) => x.id === id);
  if (!c) return <p className="text-muted">Esta cartera todavía no tiene clientes.</p>;

  const polizas = s.polizas.filter((p) => p.clienteId === c.id);
  const deuda = deudaDe(s, c.id);
  const estado = deuda.total === 0 ? { label: "Al día", tone: "ok" as const } : deuda.dias > 30 ? { label: "Mora tardía", tone: "danger" as const } : { label: "Mora temprana", tone: "warn" as const };
  const ideas = oportunidades(s, c.id);

  // Historial armado con todo lo que pasó con el cliente
  const historial = [
    ...polizas.map((p) => ({ fecha: p.desde, icon: "verified", titulo: `Póliza de ${p.ramo.toLowerCase()} emitida`, desc: `${p.aseguradora} · ${p.numero}` })),
    ...s.cuotas.filter((q) => q.clienteId === c.id && q.pagada).map((q) => ({ fecha: q.pagada!, icon: "payments", titulo: `Pagó la cuota ${q.nro}`, desc: `${fmtPesos(q.monto)} · ${q.medio}` })),
    ...s.gestiones.filter((g) => g.clienteId === c.id).map((g) => ({ fecha: g.creada, icon: "assignment", titulo: `${g.tipo} · ${g.ramo}`, desc: `${PASOS[g.tipo][g.paso]}${g.rechazada ? " · rechazado" : ""}` })),
    ...s.leads.filter((l) => l.clienteId === c.id).flatMap((l) => l.notas.map((n) => ({ fecha: n.fecha, icon: "chat", titulo: `Oportunidad de ${l.ramo.toLowerCase()}`, desc: n.texto }))),
    ...s.mensajes.filter((m) => m.clienteId === c.id).map((m) => ({ fecha: m.fecha, icon: "forum", titulo: m.de === "cliente" ? "Escribió por WhatsApp" : `Mensaje de ${m.de === "asesor" ? "su asesora" : "cobranzas"}`, desc: m.texto })),
    ...(c.notas ?? []).map((n) => ({ fecha: n.fecha, icon: "call", titulo: "Interacción registrada", desc: n.texto })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex max-w-sm flex-col gap-1.5 text-[13px] font-semibold text-ink-2">
        Cliente
        <select className={inputClass} value={c.id} onChange={(e) => router.replace(`/asesor/cliente?id=${e.target.value}`)}>
          {mios.map((x) => (
            <option key={x.id} value={x.id}>{x.nombre}</option>
          ))}
        </select>
      </label>

      <Card className="flex flex-wrap items-center gap-4 p-5">
        <Avatar nombre={c.nombre} size={60} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 text-[26px] font-bold tracking-[-0.01em]">{c.nombre}</h1>
            {polizas.length > 0 ? <Badge tone={estado.tone}>{estado.label}</Badge> : <Badge tone="primary">Prospecto</Badge>}
            <Badge>Cliente desde {parseISO(c.desde).getFullYear()}</Badge>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            <span>DNI {c.dni}</span>
            <span>{c.telefono}</span>
            {c.email && <span>{c.email}</span>}
            <span>{c.ciudad}</span>
            <span>Origen: {c.origen}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="chat" onClick={() => setModal("wa")}>WhatsApp</Button>
          <Link href={`/asesor/cotizador?cliente=${c.id}`} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
            <Icon name="request_quote" /> Nueva cotización
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5">
          <h3 className="m-0 text-base font-bold">Pólizas activas</h3>
          {polizas.length === 0 && <p className="text-sm text-muted">Todavía no tiene pólizas.</p>}
          {polizas.map((p) => {
            const e = estadoPoliza(p, s.hoy);
            return (
              <div key={p.id} className="flex gap-3 rounded-xl border border-line-soft p-3">
                <RamoTile ramo={p.ramo} size={38} />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">{p.ramo}</span>
                    <span className="font-bold">{fmtPesos(p.prima)}</span>
                  </div>
                  <div className="truncate text-muted">{p.aseguradora} · {p.bien}</div>
                  <div className="text-xs text-faint">
                    {p.numero} · Vence {fmtFecha(p.hasta)} {e === "Por renovar" && <span className="font-semibold text-on-warn">· por renovar</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {deuda.total > 0 && (
            <div className="rounded-xl bg-warn-soft p-3 text-sm text-on-warn">
              Debe {fmtPesos(deuda.total)} ({deuda.cuotas.length} {deuda.cuotas.length === 1 ? "cuota" : "cuotas"}, {deuda.dias} días de atraso).
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="m-0 text-base font-bold">Historial</h3>
            <Button size="sm" variant="secondary" icon="add" onClick={() => setModal("nota")}>Registrar</Button>
          </div>
          <ol className="flex flex-col gap-3">
            {historial.map((h, i) => (
              <li key={i} className="flex gap-3">
                <IconTile name={h.icon} tone="neutral" size={32} />
                <div className="min-w-0 text-sm">
                  <div className="font-semibold">{h.titulo}</div>
                  <div className="text-muted">{h.desc}</div>
                  <div className="text-xs text-faint">{fmtFechaLarga(h.fecha)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-5">
            <h3 className="m-0 flex items-center gap-2 text-base font-bold">
              <Icon name="lightbulb" size={19} className="text-primary" fill /> Oportunidades
            </h3>
            {ideas.length === 0 && <p className="text-sm text-muted">Por ahora no vemos coberturas que le falten.</p>}
            {ideas.map((o) => (
              <div key={o.ramo} className="flex flex-col gap-1.5 rounded-xl bg-primary-soft/60 p-3">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <Icon name={ICONO_RAMO[o.ramo]} size={17} fill className="text-primary" /> {o.ramo}
                </span>
                <span className="text-[13px] text-muted">{o.motivo}</span>
                <Link href={`/asesor/cotizador?cliente=${c.id}&ramo=${encodeURIComponent(o.ramo)}`} className="self-start text-[13px] font-bold text-primary hover:underline">
                  Cotizar {o.ramo.toLowerCase()} →
                </Link>
              </div>
            ))}
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <h3 className="m-0 mb-1 text-base font-bold">Bienes asegurados</h3>
            {polizas.length === 0 && <p className="text-sm text-muted">Sin bienes cargados.</p>}
            {polizas.map((p) => (
              <div key={p.id} className="flex justify-between gap-3 border-b border-line-soft pb-2 text-sm last:border-0">
                <span className="font-semibold">{p.bien.split("·")[0].trim()}</span>
                <span className="text-right text-muted">{p.bien.split("·")[1]?.trim() ?? p.ramo}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {modal === "wa" && <MensajeModal clienteId={c.id} nombre={c.nombre} onClose={() => setModal(null)} />}
      {modal === "nota" && <NotaModal onSave={(t) => dispatch({ t: "cliente/nota", clienteId: c.id, texto: t })} onClose={() => setModal(null)} />}
    </div>
  );
}

export function MensajeModal({ clienteId, nombre, de = "asesor", onClose }: { clienteId: string; nombre: string; de?: "asesor" | "cobranzas"; onClose: () => void }) {
  const { dispatch } = useDemo();
  const [texto, setTexto] = useState(`Hola ${nombre.split(" ")[0]}, ¿cómo estás? `);
  return (
    <Modal title={`WhatsApp a ${nombre}`} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim().length < 3) return;
          dispatch({ t: "mensaje/enviar", clienteId, de, texto: texto.trim() });
          onClose();
        }}
      >
        <Field label="Mensaje" hint="Demo: le llega al cliente en su autogestión.">
          <textarea className={cx(inputClass, "h-28 py-2.5")} value={texto} onChange={(e) => setTexto(e.target.value)} />
        </Field>
        <Button type="submit" icon="send">Enviar</Button>
      </form>
    </Modal>
  );
}

function NotaModal({ onSave, onClose }: { onSave: (t: string) => void; onClose: () => void }) {
  const [tipo, setTipo] = useState("Llamada");
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal title="Registrar interacción" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (texto.trim().length < 5) return setError("Contá brevemente qué pasó (al menos 5 caracteres).");
          onSave(`${tipo}: ${texto.trim()}`);
          onClose();
        }}
      >
        <Field label="Tipo">
          <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {["Llamada", "Visita", "Reunión", "Email"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Qué hablaron">
          <textarea className={cx(inputClass, "h-24 py-2.5")} value={texto} onChange={(e) => { setTexto(e.target.value); setError(""); }} placeholder="Ej. Quiere sumar a su hija como conductora" />
        </Field>
        {error && <p role="alert" className="text-sm font-semibold text-on-danger">{error}</p>}
        <Button type="submit">Guardar</Button>
      </form>
    </Modal>
  );
}
