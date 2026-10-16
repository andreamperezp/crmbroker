"use client";

/** Seguimiento postventa: la agenda que hace que el cliente se sienta acompañado. */
import Link from "next/link";
import { useState } from "react";
import { MensajeModal } from "./ficha";
import { Badge, Button, Card, Icon, Loading, PageHeader, cx, type Tone } from "@/components/ui";
import { fmtFecha, fmtFechaLarga } from "@/lib/format";
import { cliente } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import type { TipoTarea } from "@/lib/types";

const TONO: Record<TipoTarea, Tone> = { Bienvenida: "ok", "Control 30 días": "primary", Renovación: "warn", "Post-siniestro": "info", Deuda: "danger", Aniversario: "primary" };

const RITMO = [
  ["Día 1", "Bienvenida: explicarle su póliza y cómo usar la autogestión"],
  ["Día 30", "Control: ¿le quedó claro qué cubre? ¿Le falta algo?"],
  ["Después de un siniestro", "Llamarlo ese mismo día y contarle cada paso"],
  ["Si se atrasa", "Hablar antes que cobranzas: entender qué le pasa"],
  ["60 días antes de vencer", "Adelantarle la renovación con una propuesta"],
  ["Cada aniversario", "Revisar si la cobertura sigue acompañando su vida"],
];

export function Postventa() {
  const { s, dispatch } = useDemo();
  const [wa, setWa] = useState<string | null>(null);
  const [verHechas, setVerHechas] = useState(false);
  if (!s) return <Loading />;

  const mias = s.tareas.filter((t) => t.asesorId === s.asesorActual).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pendientes = mias.filter((t) => !t.hecha);
  const hoyCount = pendientes.filter((t) => t.fecha <= s.hoy).length;
  const lista = verHechas ? mias.filter((t) => t.hecha) : pendientes;
  const waCliente = wa ? cliente(s, wa) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Seguimiento postventa" subtitle={`${fmtFechaLarga(s.hoy).replace(/^./, (c) => c.toUpperCase())} · ${hoyCount} para hoy, ${pendientes.length} pendientes en total`}>
        <Button variant="ghost" onClick={() => setVerHechas(!verHechas)}>{verHechas ? "Ver pendientes" : `Ver hechas (${mias.length - pendientes.length})`}</Button>
      </PageHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="divide-y divide-line-soft">
          {lista.length === 0 && <p className="p-6 text-center text-sm text-muted">{verHechas ? "Todavía no marcaste tareas como hechas." : "¡Agenda al día! No quedan seguimientos pendientes."}</p>}
          {lista.map((t) => {
            const c = cliente(s, t.clienteId);
            const vencida = !t.hecha && t.fecha < s.hoy;
            return (
              <div key={t.id} className="flex items-start gap-3 p-4">
                <button
                  onClick={() => dispatch({ t: "tarea/hecha", tareaId: t.id })}
                  disabled={t.hecha}
                  aria-label={t.hecha ? "Hecha" : `Marcar como hecha: ${t.tipo} con ${c.nombre}`}
                  className={cx("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-[1.5px]", t.hecha ? "border-ok bg-ok text-white" : "border-input hover:border-primary")}
                >
                  {t.hecha && <Icon name="check" size={16} />}
                </button>
                <span className={cx("w-16 shrink-0 pt-0.5 text-xs font-bold", vencida ? "text-on-danger" : t.fecha === s.hoy ? "text-primary" : "text-faint")}>
                  {t.fecha === s.hoy ? "Hoy" : vencida ? `Vencida ${fmtFecha(t.fecha)}` : fmtFecha(t.fecha)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/asesor/cliente?id=${c.id}`} className="font-bold hover:text-primary">{c.nombre}</Link>
                    <Badge tone={TONO[t.tipo]}>{t.tipo}</Badge>
                  </div>
                  <p className={cx("mt-0.5 text-sm", t.hecha ? "text-faint line-through" : "text-muted")}>{t.detalle}</p>
                </div>
                {!t.hecha && (
                  <Button size="sm" variant="secondary" icon="chat" onClick={() => setWa(c.id)} aria-label={`Escribirle a ${c.nombre}`}>
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                )}
              </div>
            );
          })}
        </Card>

        <Card className="flex h-fit flex-col gap-3 p-5">
          <h3 className="m-0 text-base font-bold">Ritmo de acompañamiento</h3>
          <p className="text-[13px] text-muted">Contactos que se agendan solos al emitir una póliza, al denunciar un siniestro o cuando un cliente se atrasa.</p>
          {RITMO.map(([cuando, que]) => (
            <div key={cuando} className="flex gap-3 border-t border-line-soft pt-3 text-sm">
              <span className="w-24 shrink-0 font-bold text-primary">{cuando}</span>
              <span className="text-muted">{que}</span>
            </div>
          ))}
        </Card>
      </div>

      {waCliente && <MensajeModal clienteId={waCliente.id} nombre={waCliente.nombre} onClose={() => setWa(null)} />}
    </div>
  );
}
