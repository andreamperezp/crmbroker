"use client";

/** Mora: quién se atrasó, cuánto y qué hacemos con cada uno. */
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, Loading, PageHeader, Segmented, cx } from "@/components/ui";
import { fmtFecha, fmtPesos } from "@/lib/format";
import { CORTE_MORA, cliente, deudaDe, moraPendiente, vencidas } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import type { Estado } from "@/lib/types";

/** Una fila por cliente en mora */
export function morosos(s: Estado) {
  return [...new Set(vencidas(s).map((q) => q.clienteId))]
    .map((id) => {
      const d = deudaDe(s, id);
      const ultimo = [...d.cuotas.flatMap((q) => q.historial), ...s.mensajes.filter((m) => m.clienteId === id && m.de === "cobranzas").map((m) => ({ fecha: m.fecha, texto: "WhatsApp de cobranzas" }))].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
      const promesa = d.cuotas.find((q) => q.promesa && q.promesa >= s.hoy)?.promesa;
      const pendientes = d.cuotas.filter((q) => moraPendiente(q, s.hoy));
      const polizas = [...new Set(d.cuotas.map((q) => q.polizaId))].map((pid) => s.polizas.find((p) => p.id === pid)!);
      return { id, c: cliente(s, id), ...d, ultimo, promesa, pendientes, polizas, tardia: d.dias > CORTE_MORA };
    })
    .sort((a, b) => b.dias - a.dias);
}

export function Mora() {
  const { s, dispatch } = useDemo();
  const [nivel, setNivel] = useState<"temprana" | "tardia">("temprana");
  const [aviso, setAviso] = useState("");
  if (!s) return <Loading />;

  const todos = morosos(s);
  const filas = todos.filter((f) => (nivel === "tardia" ? f.tardia : !f.tardia));
  const deuda = todos.reduce((t, f) => t + f.total, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mora" subtitle={`${todos.length} clientes con cuotas vencidas · ${fmtPesos(deuda)} a recuperar`}>
        <Segmented
          label="Nivel de mora"
          value={nivel}
          onChange={(v) => { setNivel(v); setAviso(""); }}
          options={[
            { value: "temprana", label: `Temprana · ${todos.filter((f) => !f.tardia).length}` },
            { value: "tardia", label: `Tardía · ${todos.filter((f) => f.tardia).length}` },
          ]}
        />
        <Button
          variant="emphasis"
          icon="campaign"
          disabled={filas.length === 0}
          onClick={() => {
            dispatch({ t: "cobranza/recordatorioMasivo", nivel });
            setAviso(`Enviamos un recordatorio por WhatsApp a ${filas.length} ${filas.length === 1 ? "cliente" : "clientes"} en mora ${nivel === "tardia" ? "tardía" : "temprana"}.`);
          }}
        >
          Recordatorio masivo
        </Button>
      </PageHeader>
      {aviso && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-on-ok">{aviso}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-faint">
              {["Cliente", "Póliza", "Atraso", "Deuda", "Último contacto", "Próximo paso", ""].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">Nadie en mora {nivel === "tardia" ? "tardía" : "temprana"}. ¡Bien!</td></tr>}
            {filas.map((f) => (
              <tr key={f.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-bold">{f.c.nombre}</td>
                <td className="px-4 py-3">
                  {f.polizas.map((p) => (
                    <span key={p.id} className="block"><span className="font-semibold">{p.numero}</span> <span className="text-xs text-faint">{p.aseguradora}</span></span>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <span className={cx("block font-bold", f.tardia ? "text-on-danger" : "text-on-warn")}>{f.dias} días</span>
                  <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-segment">
                    <span className={cx("block h-full rounded-full", f.tardia ? "bg-danger" : "bg-warn")} style={{ width: `${Math.min(100, (f.dias / 60) * 100)}%` }} />
                  </span>
                </td>
                <td className="px-4 py-3 font-bold">{fmtPesos(f.total)}<span className="block text-xs font-medium text-faint">{f.cuotas.length} {f.cuotas.length === 1 ? "cuota" : "cuotas"}</span></td>
                <td className="px-4 py-3 text-muted">{f.ultimo ? <><span className="block">{f.ultimo.texto}</span><span className="text-xs text-faint">{fmtFecha(f.ultimo.fecha)}</span></> : "Sin contacto"}</td>
                <td className="px-4 py-3">
                  {f.promesa ? (
                    <Badge tone="info" icon="handshake">Promesa para el {fmtFecha(f.promesa)}</Badge>
                  ) : f.pendientes.length ? (
                    <button onClick={() => f.pendientes.forEach((q) => dispatch({ t: "cuota/mora", cuotaId: q.id, nivel: moraPendiente(q, s.hoy)! }))} className="text-left text-[13px] font-bold text-on-danger hover:underline">
                      Confirmar pase a mora {f.tardia ? "tardía" : "temprana"}
                    </button>
                  ) : (
                    <span className="text-[13px] text-muted">{f.tardia ? "Ofrecer plan de pago" : "Llamar y recordar"}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/cobranzas/contacto?cliente=${f.id}`} className="inline-flex h-8 items-center rounded-[10px] border border-line px-3 text-[13px] font-semibold hover:bg-bg">Gestionar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-[13px] text-muted">Al confirmar el pase a mora, el cliente ve un aviso en su autogestión y su asesor recibe una tarea para acompañarlo.</p>
    </div>
  );
}
