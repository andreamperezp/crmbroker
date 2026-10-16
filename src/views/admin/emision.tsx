"use client";

/** Emisión de póliza: de la oportunidad ganada a la póliza emitida, en cuatro pasos. */
import Link from "next/link";
import { useState } from "react";
import { abierta, codigo } from "./tramites";
import { RamoTile } from "@/components/ramo";
import { Badge, Button, Card, Empty, Field, Icon, Loading, PageHeader, Steps, cx, inputClass } from "@/components/ui";
import { COBERTURAS, ofertas } from "@/lib/cotizar";
import { fmtPesos } from "@/lib/format";
import { asesor, cliente } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { CHECKLIST, PASOS, type Estado, type Gestion } from "@/lib/types";

const PASOS_UI = ["Cliente", "Riesgo", "Plan", "Revisión"];

export function Emision() {
  const { s } = useDemo();
  const [sel, setSel] = useState<string | null>(null);
  const [emitida, setEmitida] = useState<string | null>(null);
  if (!s) return <Loading />;

  const pendientes = s.gestiones.filter((g) => g.tipo === "Emisión" && abierta(g));
  const actual = s.gestiones.find((g) => g.id === sel && abierta(g)) ?? pendientes[0];
  const recien = emitida ? s.gestiones.find((g) => g.id === emitida) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Emisión de póliza" subtitle={actual ? `Solicitud ${codigo(actual)} · ${cliente(s, actual.clienteId).nombre} · ${actual.ramo}` : "Sin emisiones pendientes"} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="flex h-fit flex-col gap-1 p-2">
          <span className="px-2 pt-2 pb-1 text-xs font-bold tracking-[0.08em] text-faint uppercase">Pendientes ({pendientes.length})</span>
          {pendientes.length === 0 && <p className="p-3 text-sm text-muted">Cuando un asesor gane una oportunidad, aparece acá.</p>}
          {pendientes.map((g) => (
            <button key={g.id} onClick={() => { setSel(g.id); setEmitida(null); }} className={cx("flex items-center gap-2.5 rounded-xl p-2.5 text-left", actual?.id === g.id && !recien ? "bg-primary-soft" : "hover:bg-bg")}>
              <RamoTile ramo={g.ramo} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{cliente(s, g.clienteId).nombre}</span>
                <span className="block text-xs text-muted">{codigo(g)} · {g.ramo}</span>
              </span>
            </button>
          ))}
        </Card>

        {recien ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-ok-soft text-on-ok"><Icon name="verified" size={34} fill /></span>
            <h2 className="m-0 text-2xl font-bold">Póliza emitida</h2>
            <p className="max-w-md text-muted">
              La póliza de {recien.ramo.toLowerCase()} de {cliente(s, recien.clienteId).nombre} ya está vigente. El cliente la ve en su autogestión, cobranzas recibió la primera cuota y
              {" "}{asesor(s, cliente(s, recien.clienteId).asesorId).nombre.split(" ")[0]} tiene una tarea para darle la bienvenida.
            </p>
            <div className="flex gap-2">
              <Link href="/autogestion" className="inline-flex h-10 items-center rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-bg">Verla como cliente</Link>
              {pendientes.length > 0 && <Button onClick={() => setEmitida(null)}>Siguiente emisión</Button>}
            </div>
          </Card>
        ) : actual ? (
          <Asistente key={actual.id} s={s} g={actual} onEmitida={() => setEmitida(actual.id)} />
        ) : (
          <Card><Empty icon="post_add" title="No hay emisiones pendientes">Ganá una oportunidad en el pipeline del asesor y volvé: la vas a ver acá.</Empty></Card>
        )}
      </div>
    </div>
  );
}

function Asistente({ s, g, onEmitida }: { s: Estado; g: Gestion; onEmitida: () => void }) {
  const { dispatch } = useDemo();
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState("");
  const c = cliente(s, g.clienteId);
  const lead = s.leads.find((l) => l.id === g.leadId);
  const opciones = ofertas(g.ramo, COBERTURAS[g.ramo].at(-1)!.id, g.ramo.length);
  const elegida = lead?.cotizacion?.aseguradora ?? opciones.find((o) => o.recomendada)!.aseguradora;
  const plan = opciones.find((o) => o.aseguradora === elegida) ?? opciones[0];
  const precio = lead?.cotizacion?.precio ?? plan.precio;

  const emitir = () => {
    if (!g.checks.every(Boolean)) return setAviso("Antes de emitir, completá la documentación del checklist.");
    if (!g.responsable) dispatch({ t: "gestion/tomar", gestionId: g.id });
    if (lead && !lead.cotizacion) dispatch({ t: "lead/plan", leadId: lead.id, aseguradora: plan.aseguradora, plan: plan.plan, precio: plan.precio });
    for (let i = g.paso; i < PASOS["Emisión"].length - 1; i++) dispatch({ t: "gestion/avanzar", gestionId: g.id });
    onEmitida();
  };

  return (
    <Card className="flex flex-col gap-5 p-5 sm:p-6">
      <Steps steps={PASOS_UI} current={paso} />

      {paso === 0 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="Nombre y apellido"><input className={inputClass} defaultValue={c.nombre} /></Field>
          <Field label="DNI"><input className={inputClass} defaultValue={c.dni === "Sin cargar" ? "" : c.dni} placeholder="Pedírselo al cliente" /></Field>
          <Field label="Celular"><input className={inputClass} defaultValue={c.telefono} /></Field>
          <Field label="Email"><input className={inputClass} defaultValue={c.email} /></Field>
          <Field label="Ciudad"><input className={inputClass} defaultValue={c.ciudad} /></Field>
          <Field label="Asesor"><input className={inputClass} defaultValue={asesor(s, c.asesorId).nombre} readOnly /></Field>
        </div>
      )}

      {paso === 1 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="Ramo"><input className={inputClass} defaultValue={g.ramo} readOnly /></Field>
          <Field label="Bien asegurado"><input className={inputClass} defaultValue={lead?.bien ?? g.detalle} /></Field>
          {g.ramo === "Auto" ? (
            <>
              <Field label="Patente"><input className={inputClass} placeholder="AB 123 CD" /></Field>
              <Field label="Uso"><select className={inputClass}><option>Particular</option><option>Comercial</option></select></Field>
            </>
          ) : (
            <>
              <Field label="Domicilio del riesgo"><input className={inputClass} defaultValue={c.ciudad} /></Field>
              <Field label="Superficie / detalle"><input className={inputClass} placeholder="Ej. 120 m²" /></Field>
            </>
          )}
          <Field label="Inicio de vigencia"><input type="date" className={inputClass} defaultValue={s.hoy} /></Field>
        </div>
      )}

      {paso === 2 && (
        <div className="flex flex-col gap-2.5">
          {opciones.map((o) => {
            const on = o.aseguradora === plan.aseguradora;
            return (
              <button
                key={o.aseguradora}
                onClick={() => lead && dispatch({ t: "lead/plan", leadId: lead.id, aseguradora: o.aseguradora, plan: o.plan, precio: o.precio })}
                aria-pressed={on}
                className={cx("flex items-center gap-4 rounded-xl border-[1.5px] p-3.5 text-left", on ? "border-primary bg-primary-soft/50" : "border-line hover:bg-bg")}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-bold">{o.aseguradora} {lead?.cotizacion?.aseguradora === o.aseguradora && <Badge tone="primary">Elegida</Badge>}</span>
                  <span className="block text-[13px] text-muted">{o.plan} · {o.extra}</span>
                </span>
                <span className="text-lg font-extrabold">{fmtPesos(lead?.cotizacion?.aseguradora === o.aseguradora ? lead.cotizacion.precio : o.precio)}<span className="text-xs font-medium text-faint"> /mes</span></span>
              </button>
            );
          })}
        </div>
      )}

      {paso === 3 && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-xl bg-bg p-4 text-sm">
            <span className="text-xs font-bold text-faint">Resumen</span>
            {[
              ["Asegurado", c.nombre],
              ["Ramo", g.ramo],
              ["Bien", lead?.bien ?? g.detalle],
              ["Aseguradora", plan.aseguradora],
              ["Plan", lead?.cotizacion?.plan ?? plan.plan],
              ["Cuota mensual", fmtPesos(precio)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right font-semibold">{v}</span></div>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-faint">Documentación</span>
            {CHECKLIST["Emisión"].map((item, i) => (
              <button key={item} onClick={() => { dispatch({ t: "gestion/check", gestionId: g.id, i }); setAviso(""); }} aria-pressed={g.checks[i]} className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-bg">
                <Icon name={g.checks[i] ? "check_circle" : "radio_button_unchecked"} fill={g.checks[i]} size={20} className={g.checks[i] ? "text-ok" : "text-faint"} />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {aviso && <p role="alert" className="rounded-xl bg-warn-soft p-3 text-sm font-semibold text-on-warn">{aviso}</p>}

      <div className="flex justify-between gap-2 border-t border-line pt-4">
        <Button variant="secondary" onClick={() => setPaso(paso - 1)} disabled={paso === 0}>Anterior</Button>
        {paso < 3 ? <Button onClick={() => setPaso(paso + 1)}>Siguiente</Button> : <Button icon="verified" onClick={emitir}>Emitir póliza</Button>}
      </div>
    </Card>
  );
}
