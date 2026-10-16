"use client";

/** Reportes de cobranza: efectividad por mes y por aseguradora. */
import { useState } from "react";
import { Button, Card, Loading, PageHeader, cx } from "@/components/ui";
import { addMonths, fmtPesos, parseISO } from "@/lib/format";
import { vencidas } from "@/lib/rules";
import { ASEGURADORAS } from "@/lib/seed";
import { useDemo } from "@/lib/store";

const MES = new Intl.DateTimeFormat("es-AR", { month: "short" });

export function Reportes() {
  const { s } = useDemo();
  const [aviso, setAviso] = useState("");
  if (!s) return <Loading />;

  // Efectividad: cuotas que vencieron en el mes y se cobraron dentro del mismo mes
  const meses = [-3, -2, -1, 0].map((k) => {
    const ym = addMonths(s.hoy, k).slice(0, 7);
    const venc = s.cuotas.filter((q) => q.vence.startsWith(ym) && (k < 0 || q.vence <= s.hoy));
    const cobradas = venc.filter((q) => q.pagada && q.pagada.slice(0, 7) <= ym);
    return { label: MES.format(parseISO(`${ym}-01`)).replace(".", ""), v: venc.length ? Math.round((cobradas.length / venc.length) * 100) : 100, actual: k === 0 };
  });

  const porAseguradora = ASEGURADORAS.map((a) => {
    const pols = s.polizas.filter((p) => p.aseguradora === a).map((p) => p.id);
    const qs = s.cuotas.filter((q) => pols.includes(q.polizaId) && q.vence <= s.hoy);
    const cobrado = qs.filter((q) => q.pagada).reduce((t, q) => t + q.monto, 0);
    const mora = vencidas(s).filter((q) => pols.includes(q.polizaId)).reduce((t, q) => t + q.monto, 0);
    return { a, polizas: pols.length, cobrado, mora, efectividad: qs.length ? Math.round((qs.filter((q) => q.pagada).length / qs.length) * 100) : 100 };
  }).filter((r) => r.polizas > 0);

  const ultimo = meses[meses.length - 2];
  const actual = meses[meses.length - 1];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reportes de cobranza" subtitle={`Últimos ${meses.length} meses · cartera de demo`}>
        <Button variant="secondary" icon="picture_as_pdf" onClick={() => setAviso("Descargaste el reporte en PDF (en la demo no se genera el archivo).")}>PDF</Button>
        <Button variant="secondary" icon="table_view" onClick={() => setAviso("Descargaste el reporte en Excel (en la demo no se genera el archivo).")}>Excel</Button>
      </PageHeader>
      {aviso && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-on-ok">{aviso}</p>}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <div>
            <h3 className="m-0 text-base font-bold">Efectividad de cobro</h3>
            <p className="text-[13px] text-muted">% de cuotas cobradas dentro del mes en que vencieron. {actual.label[0].toUpperCase() + actual.label.slice(1)} está en curso: cuenta solo lo que ya venció{actual.v >= ultimo.v ? " y vamos mejor que el mes anterior" : ", así que todavía hay margen para recuperar"}.</p>
          </div>
          <div className="flex h-52 items-end gap-5" role="img" aria-label={meses.map((m) => `${m.label}: ${m.v} %`).join(", ")}>
            {meses.map((m) => (
              <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-sm font-bold">{m.v} %</span>
                <div className={cx("w-full max-w-14 rounded-t-md", m.actual ? "bg-primary" : "bg-primary/35")} style={{ height: `${m.v}%` }} />
                <span className="text-xs font-semibold text-muted capitalize">{m.label}{m.actual && " (en curso)"}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-x-auto p-5">
          <h3 className="m-0 mb-3 text-base font-bold">Por aseguradora</h3>
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs text-faint">
                {["Aseguradora", "Pólizas", "Cobrado", "En mora", "Efectividad"].map((h) => <th key={h} className="pb-2 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {porAseguradora.map((r) => (
                <tr key={r.a} className="border-t border-line-soft">
                  <td className="py-2.5 font-bold">{r.a}</td>
                  <td className="py-2.5">{r.polizas}</td>
                  <td className="py-2.5">{fmtPesos(r.cobrado)}</td>
                  <td className={cx("py-2.5", r.mora ? "font-semibold text-on-danger" : "text-faint")}>{r.mora ? fmtPesos(r.mora) : "—"}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-segment"><span className={cx("block h-full rounded-full", r.efectividad >= 85 ? "bg-ok" : r.efectividad >= 70 ? "bg-warn" : "bg-danger")} style={{ width: `${r.efectividad}%` }} /></span>
                      {r.efectividad} %
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
