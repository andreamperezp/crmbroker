"use client";

/** Plan de pago: refinanciar la deuda sin que el cliente pierda la cobertura. */
import { useState } from "react";
import { morosos } from "./mora";
import { Badge, Button, Card, Empty, Icon, Loading, PageHeader, Segmented, cx } from "@/components/ui";
import { addDays, addMonths, fmtFecha, fmtPesos } from "@/lib/format";
import { cliente, recargoPlan } from "@/lib/rules";
import { useDemo } from "@/lib/store";

export function Planes() {
  const { s, dispatch } = useDemo();
  const [sel, setSel] = useState<string | null>(null);
  const [cuotas, setCuotas] = useState<"2" | "3" | "4" | "6">("3");
  const [listo, setListo] = useState<string | null>(null);
  if (!s) return <Loading />;

  const deudores = morosos(s);
  const cur = deudores.find((d) => d.id === sel) ?? deudores[0];
  const n = Number(cuotas);
  const recargo = recargoPlan(n);
  const total = cur ? Math.round(cur.total * (1 + recargo / 100)) : 0;
  const cronograma = Array.from({ length: n }, (_, k) => ({ n: k + 1, fecha: addMonths(addDays(s.hoy, 7), k), monto: Math.round(total / n) }));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Plan de pago" subtitle="Refinanciá la deuda sin que el cliente pierda la cobertura" />
      {listo && (
        <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-on-ok">
          Listo: {listo} ya tiene su plan. Lo ve en su autogestión y su asesora recibió el aviso.
        </p>
      )}
      {!cur ? (
        <Card><Empty icon="sentiment_satisfied" title="No hay deudas para refinanciar">Cuando un cliente se atrase, vas a poder armarle un plan desde acá.</Empty></Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="flex flex-col gap-4 p-5">
            <span className="text-[13px] font-semibold text-ink-2">Cliente</span>
            <div className="flex flex-col gap-1.5">
              {deudores.map((d) => (
                <button key={d.id} onClick={() => { setSel(d.id); setListo(null); }} aria-pressed={d.id === cur.id} className={cx("flex items-center justify-between gap-3 rounded-xl border-[1.5px] p-3 text-left", d.id === cur.id ? "border-primary bg-primary-soft/50" : "border-line hover:bg-bg")}>
                  <span>
                    <span className="block text-sm font-bold">{d.c.nombre}</span>
                    <span className="block text-xs text-muted">{d.cuotas.length} {d.cuotas.length === 1 ? "cuota" : "cuotas"} · {d.dias} días de atraso</span>
                  </span>
                  <span className="font-bold">{fmtPesos(d.total)}</span>
                </button>
              ))}
            </div>
            <span className="text-[13px] font-semibold text-ink-2">Cantidad de cuotas</span>
            <Segmented label="Cantidad de cuotas" value={cuotas} onChange={setCuotas} options={(["2", "3", "4", "6"] as const).map((v) => ({ value: v, label: `${v} cuotas` }))} />
            <span className="text-xs text-muted">Hasta 3 cuotas sin recargo · 4 cuotas 5 % · 6 cuotas 10 %</span>
            <div className="flex gap-2 rounded-xl bg-info-soft p-3 text-[13px] text-on-info">
              <Icon name="info" size={18} />
              La aseguradora mantiene la cobertura mientras el plan esté al día. Si se atrasan 2 cuotas del plan, la póliza pasa a mora tardía.
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <h3 className="m-0 text-base font-bold">Cronograma</h3>
            {cronograma.map((r) => (
              <div key={r.n} className="flex justify-between border-t border-line-soft pt-2.5 text-sm">
                <span><span className="font-semibold">Cuota {r.n}</span><span className="text-muted"> · {fmtFecha(r.fecha)}</span></span>
                <span className="font-bold">{fmtPesos(r.monto)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between rounded-xl bg-bg p-3 text-sm">
              <span className="font-semibold">Total {recargo ? `con ${recargo} % de recargo` : "sin recargo"}</span>
              <span className="text-lg font-extrabold">{fmtPesos(total)}</span>
            </div>
            <Button
              icon="send"
              onClick={() => {
                dispatch({ t: "plan/crear", clienteId: cur.id, cuotas: n });
                setListo(cur.c.nombre);
                setSel(null);
              }}
            >
              Generar plan y enviar al cliente
            </Button>
          </Card>
        </div>
      )}
      {s.planes.length > 0 && (
        <Card className="flex flex-col gap-2 p-5">
          <h3 className="m-0 mb-1 text-base font-bold">Planes activos</h3>
          {s.planes.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2 text-sm">
              <span className="font-bold">{cliente(s, p.clienteId).nombre}</span>
              <span className="text-muted">{p.cuotas.length} cuotas de {fmtPesos(p.cuotas[0].monto)} · primera el {fmtFecha(p.cuotas[0].fecha)}</span>
              <Badge tone="ok">Al día</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
