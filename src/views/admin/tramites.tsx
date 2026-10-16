"use client";

/** Bandeja de trámites: todo lo que administración tiene que resolver, con su tiempo de respuesta. */
import { useState } from "react";
import { ICONO_GESTION } from "@/components/ramo";
import { Badge, Button, Card, Chip, Icon, IconTile, Loading, PageHeader, Steps, cx } from "@/components/ui";
import { fmtFecha, fmtPesos } from "@/lib/format";
import { asesor, cliente, poliza, sla } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { CHECKLIST, PASOS, TIPOS_GESTION, type Estado, type Gestion, type TipoGestion } from "@/lib/types";

export const abierta = (g: Gestion) => !g.rechazada && g.paso < PASOS[g.tipo].length - 1;
export const codigo = (g: Gestion) => `TR-${2400 + Number(g.id.replace(/\D/g, ""))}`;

export function Tramites() {
  const { s } = useDemo();
  const [tipo, setTipo] = useState<TipoGestion | "Todos">("Todos");
  const [sel, setSel] = useState<string | null>(null);
  const [cerrados, setCerrados] = useState(false);
  if (!s) return <Loading />;

  const todas = [...s.gestiones].sort((a, b) => a.vence.localeCompare(b.vence));
  const base = todas.filter((g) => (cerrados ? !abierta(g) : abierta(g)));
  const filas = base.filter((g) => tipo === "Todos" || g.tipo === tipo);
  const actual = s.gestiones.find((g) => g.id === sel) ?? filas[0];
  const abiertas = todas.filter(abierta);
  const vencenHoy = abiertas.filter((g) => g.vence <= s.hoy).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Bandeja de trámites" subtitle={`${abiertas.length} abiertos · ${vencenHoy} vencen hoy o ya vencieron`}>
        <Button variant="ghost" onClick={() => setCerrados(!cerrados)}>{cerrados ? "Ver abiertos" : "Ver cerrados"}</Button>
      </PageHeader>
      <div className="flex flex-wrap gap-2">
        <Chip active={tipo === "Todos"} onClick={() => setTipo("Todos")} count={base.length}>Todos</Chip>
        {TIPOS_GESTION.map((t) => (
          <Chip key={t} active={tipo === t} onClick={() => setTipo(t)} count={base.filter((g) => g.tipo === t).length}>{t}</Chip>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card className="divide-y divide-line-soft">
          {filas.length === 0 && <p className="p-8 text-center text-sm text-muted">No hay trámites {cerrados ? "cerrados" : "abiertos"} de este tipo.</p>}
          {filas.map((g) => {
            const t = sla(g, s.hoy);
            const on = actual?.id === g.id;
            return (
              <button key={g.id} onClick={() => setSel(g.id)} aria-pressed={on} className={cx("flex w-full items-center gap-3 p-4 text-left transition-colors", on ? "bg-primary-soft/60" : "hover:bg-bg")}>
                <IconTile name={ICONO_GESTION[g.tipo]} tone={g.tipo === "Siniestro" ? "info" : "primary"} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{cliente(s, g.clienteId).nombre}</span>
                    <span className="text-xs font-semibold text-faint">{codigo(g)}</span>
                  </div>
                  <div className="truncate text-[13px] text-muted">{g.tipo} · {g.ramo} · {poliza(s, g.polizaId)?.aseguradora ?? s.leads.find((l) => l.id === g.leadId)?.cotizacion?.aseguradora ?? "A definir"}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={g.rechazada ? "danger" : abierta(g) ? "info" : "ok"}>{g.rechazada ? "Rechazado" : PASOS[g.tipo][g.paso]}</Badge>
                  {abierta(g) && <Badge tone={t.tone} icon="schedule">{t.label}</Badge>}
                </div>
              </button>
            );
          })}
        </Card>
        {actual && <Detalle key={actual.id} s={s} g={actual} />}
      </div>
    </div>
  );
}

export function Detalle({ s, g }: { s: Estado; g: Gestion }) {
  const { dispatch } = useDemo();
  const [aviso, setAviso] = useState("");
  const c = cliente(s, g.clienteId);
  const pol = poliza(s, g.polizaId);
  const pasos = PASOS[g.tipo];
  const t = sla(g, s.hoy);
  const siguiente = pasos[g.paso + 1];
  const ultimo = g.paso + 1 === pasos.length - 1;
  const completo = g.checks.every(Boolean);

  return (
    <Card className="flex h-fit flex-col gap-4 p-5 lg:sticky lg:top-20">
      <div>
        <span className="text-xs font-semibold text-faint">{codigo(g)} · {g.tipo}</span>
        <h3 className="m-0 mt-1 text-xl font-bold">{c.nombre}</h3>
        <span className="text-sm text-muted">{g.ramo} · {g.detalle}</span>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-bg p-3 text-sm">
        <div><dt className="text-xs text-faint">Aseguradora</dt><dd className="font-semibold">{pol?.aseguradora ?? s.leads.find((l) => l.id === g.leadId)?.cotizacion?.aseguradora ?? "A definir"}</dd></div>
        <div><dt className="text-xs text-faint">Asesor</dt><dd className="font-semibold">{asesor(s, c.asesorId).nombre}</dd></div>
        <div><dt className="text-xs text-faint">Responsable</dt><dd className="font-semibold">{g.responsable ?? "Sin asignar"}</dd></div>
        <div><dt className="text-xs text-faint">Tiempo de respuesta</dt><dd className={cx("font-semibold", t.tone === "danger" ? "text-on-danger" : t.tone === "warn" ? "text-on-warn" : "text-on-ok")}>{abierta(g) ? t.label : "Cerrado"}</dd></div>
        {g.monto && <div className="col-span-2"><dt className="text-xs text-faint">Monto estimado</dt><dd className="font-semibold">{fmtPesos(g.monto)}</dd></div>}
      </dl>
      <Steps steps={pasos} current={g.paso} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-bold">Checklist</span>
        {CHECKLIST[g.tipo].map((item, i) => (
          <button
            key={item}
            onClick={() => abierta(g) && dispatch({ t: "gestion/check", gestionId: g.id, i })}
            aria-pressed={g.checks[i]}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-left text-sm hover:bg-bg"
          >
            <Icon name={g.checks[i] ? "check_circle" : "radio_button_unchecked"} fill={g.checks[i]} size={20} className={g.checks[i] ? "text-ok" : "text-faint"} />
            <span className={g.checks[i] ? "text-muted line-through" : ""}>{item}</span>
          </button>
        ))}
      </div>
      {g.relato && (
        <div className="rounded-xl border border-line-soft p-3 text-sm">
          <span className="mb-1 block text-xs font-bold text-faint">Relato del asegurado</span>
          {g.relato}
        </div>
      )}
      <ol className="flex flex-col gap-1 text-xs text-muted">
        {[...g.historial].reverse().slice(0, 4).map((h, i) => (
          <li key={i}><span className="text-faint">{fmtFecha(h.fecha)}</span> · {h.texto}</li>
        ))}
      </ol>
      {aviso && <p role="status" className="rounded-xl bg-warn-soft p-3 text-sm font-semibold text-on-warn">{aviso}</p>}
      {abierta(g) && (
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="secondary" icon="mail" onClick={() => { dispatch({ t: "gestion/pedirDocs", gestionId: g.id }); setAviso(`Le pedimos a ${c.nombre.split(" ")[0]} lo que falta. Le llega a su autogestión.`); }}>
            Pedir documentación
          </Button>
          {!g.responsable ? (
            <Button onClick={() => dispatch({ t: "gestion/tomar", gestionId: g.id })}>Tomar trámite</Button>
          ) : (
            <Button
              icon="arrow_forward"
              onClick={() => {
                if (ultimo && !completo) return setAviso("Para cerrar el trámite, completá primero el checklist.");
                setAviso("");
                dispatch({ t: "gestion/avanzar", gestionId: g.id });
              }}
            >
              {siguiente}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
