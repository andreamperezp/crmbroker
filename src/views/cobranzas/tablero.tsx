"use client";

/** Tablero mensual de cobranza: cuánto entró, cuánto falta y quién se está atrasando. */
import Link from "next/link";
import { Badge, Card, Loading, PageHeader, Stat } from "@/components/ui";
import { addDays, daysBetween, fmtFecha, fmtPesos, parseISO } from "@/lib/format";
import { CORTE_MORA, atraso, cliente, estadoCuota, vencidas } from "@/lib/rules";
import { useDemo } from "@/lib/store";

const MES = new Intl.DateTimeFormat("es-AR", { month: "long" });

export function Tablero() {
  const { s } = useDemo();
  if (!s) return <Loading />;

  const ym = s.hoy.slice(0, 7);
  const delMes = s.cuotas.filter((q) => q.vence.startsWith(ym));
  const cobrado = s.cuotas.filter((q) => q.pagada?.startsWith(ym));
  const totalMes = delMes.reduce((t, q) => t + q.monto, 0);
  const cobradoMes = cobrado.reduce((t, q) => t + q.monto, 0);
  const porVencer = delMes.filter((q) => !q.pagada && q.vence >= s.hoy);
  const venc = vencidas(s);
  const temprana = venc.filter((q) => atraso(q, s.hoy) <= CORTE_MORA);
  const tardia = venc.filter((q) => atraso(q, s.hoy) > CORTE_MORA);
  const suma = (qs: typeof venc) => qs.reduce((t, q) => t + q.monto, 0);
  const polizas = (qs: typeof venc) => new Set(qs.map((q) => q.polizaId)).size;

  // Cobrado por semana del mes contra lo que vencía esa semana
  const semanas = [0, 1, 2, 3, 4].map((w) => {
    const desde = `${ym}-${String(w * 7 + 1).padStart(2, "0")}`;
    const hasta = addDays(desde, 6);
    const enRango = (d?: string) => !!d && d >= desde && d <= hasta && d.startsWith(ym);
    return {
      label: `Sem ${w + 1}`,
      cobrado: s.cuotas.filter((q) => enRango(q.pagada)).reduce((t, q) => t + q.monto, 0),
      objetivo: delMes.filter((q) => enRango(q.vence)).reduce((t, q) => t + q.monto, 0),
    };
  });
  const tope = Math.max(1, ...semanas.flatMap((w) => [w.cobrado, w.objetivo]));

  const pagadas = s.cuotas.filter((q) => q.pagada && q.medio);
  const medios = Object.entries(
    pagadas.reduce<Record<string, number>>((m, q) => ({ ...m, [q.medio!]: (m[q.medio!] ?? 0) + 1 }), {}),
  ).sort((a, b) => b[1] - a[1]);

  const proximos = s.cuotas.filter((q) => !q.pagada && !q.planId && daysBetween(s.hoy, q.vence) >= 0 && daysBetween(s.hoy, q.vence) <= 5).sort((a, b) => a.vence.localeCompare(b.vence));
  const mes = MES.format(parseISO(s.hoy));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`Cobranza de ${mes}`} subtitle={`${delMes.length} cuotas emitidas este mes · cartera de demo, actualizada hoy`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Cobrado" icon="check_circle" tone="ok" value={fmtPesos(cobradoMes)} bar={totalMes ? (cobradoMes / totalMes) * 100 : 0} hint={`${totalMes ? Math.round((cobradoMes / totalMes) * 100) : 0} % de ${fmtPesos(totalMes)}`} />
        <Stat label="Por vencer" icon="event" value={fmtPesos(suma(porVencer))} hint={`${porVencer.length} cuotas hasta fin de mes`} />
        <Stat label="Mora temprana · 1 a 30 días" icon="schedule" tone="warn" value={fmtPesos(suma(temprana))} hint={`${polizas(temprana)} pólizas`} />
        <Stat label="Mora tardía · más de 30 días" icon="error" tone="danger" value={fmtPesos(suma(tardia))} hint={`${polizas(tardia)} pólizas en riesgo de anulación`} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="m-0 text-base font-bold">Cobrado por semana</h3>
            <span className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" /> Cobrado</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary-soft ring-1 ring-primary/30" /> A cobrar</span>
            </span>
          </div>
          <div className="flex h-48 items-end gap-4" role="img" aria-label={`Cobrado por semana: ${semanas.map((w) => `${w.label} ${fmtPesos(w.cobrado)} de ${fmtPesos(w.objetivo)}`).join(", ")}`}>
            {semanas.map((w) => (
              <div key={w.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className="relative flex h-full w-full max-w-16 items-end">
                  <div className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary-soft" style={{ height: `${(w.objetivo / tope) * 100}%` }} />
                  <div className="relative w-full rounded-t-md bg-primary" style={{ height: `${(w.cobrado / tope) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-muted">{w.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <h3 className="m-0 text-base font-bold">Medio de pago</h3>
          {medios.map(([m, n]) => (
            <div key={m} className="flex flex-col gap-1.5">
              <span className="flex justify-between text-sm"><span>{m}</span><span className="font-bold">{Math.round((n / pagadas.length) * 100)} %</span></span>
              <span className="h-2 overflow-hidden rounded-full bg-segment"><span className="block h-full rounded-full bg-primary" style={{ width: `${(n / pagadas.length) * 100}%` }} /></span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="flex flex-col gap-2 p-5">
        <h3 className="m-0 mb-1 text-base font-bold">Vencen en los próximos 5 días</h3>
        {proximos.length === 0 && <p className="text-sm text-muted">No hay vencimientos cercanos.</p>}
        {proximos.map((q) => {
          const pol = s.polizas.find((p) => p.id === q.polizaId)!;
          const e = estadoCuota(q, s.hoy);
          return (
            <div key={q.id} className="flex items-center justify-between gap-3 border-t border-line-soft pt-2 text-sm">
              <div>
                <Link href={`/cobranzas/contacto?cliente=${q.clienteId}`} className="font-bold hover:text-primary">{cliente(s, q.clienteId).nombre}</Link>
                <div className="text-xs text-muted">{pol.numero} · {pol.ramo} · cuota {q.nro}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{fmtPesos(q.monto)}</div>
                <Badge tone={e === "Vence hoy" ? "warn" : "neutral"}>{e === "Vence hoy" ? "Vence hoy" : fmtFecha(q.vence)}</Badge>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
