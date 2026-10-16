"use client";

/** Renovaciones próximas: adelantarse antes de que el cliente se vaya a otra compañía. */
import { useState } from "react";
import { RamoTile } from "@/components/ramo";
import { Badge, Button, Card, Loading, PageHeader, Segmented } from "@/components/ui";
import { daysBetween, fmtFecha, fmtPesos } from "@/lib/format";
import { cliente, deudaDe } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS } from "@/lib/types";

/** Ajuste estimado de la prima al renovar (inflación + siniestralidad del ramo) */
const AJUSTE = { Auto: 0.14, Hogar: 0.11, Vida: 0.08, Comercio: 0.12, "Accidentes personales": 0.07 } as const;

export function Renovaciones() {
  const { s, dispatch } = useDemo();
  const [rango, setRango] = useState<"30" | "60" | "365">("60");
  if (!s) return <Loading />;

  const filas = s.polizas
    .filter((p) => cliente(s, p.clienteId).asesorId === s.asesorActual)
    .map((p) => {
      const dias = daysBetween(s.hoy, p.hasta);
      const propuesta = Math.round((p.prima * (1 + AJUSTE[p.ramo])) / 100) * 100;
      const deuda = deudaDe(s, p.clienteId);
      const riesgo = deuda.dias > 30 ? "Alto" : deuda.total > 0 || dias <= 15 ? "Medio" : "Bajo";
      const enGestion = s.gestiones.some((g) => g.polizaId === p.id && g.tipo === "Renovación" && g.paso < PASOS["Renovación"].length - 1);
      return { p, dias, propuesta, riesgo, enGestion };
    })
    .filter((f) => f.dias >= 0 && f.dias <= Number(rango))
    .sort((a, b) => a.dias - b.dias);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Renovaciones próximas" subtitle={`${filas.length} pólizas vencen en los próximos ${rango === "365" ? "12 meses" : `${rango} días`}`}>
        <Segmented label="Rango" value={rango} onChange={setRango} options={[{ value: "30", label: "30 días" }, { value: "60", label: "60 días" }, { value: "365", label: "12 meses" }]} />
      </PageHeader>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold text-faint">
              {["Cliente", "Ramo", "Aseguradora", "Vence", "Prima actual", "Propuesta", "Riesgo", ""].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No hay renovaciones en este rango.</td></tr>
            )}
            {filas.map(({ p, dias, propuesta, riesgo, enGestion }) => (
              <tr key={p.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-3 font-bold">{cliente(s, p.clienteId).nombre}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-2"><RamoTile ramo={p.ramo} size={28} /> {p.ramo}</span></td>
                <td className="px-4 py-3 text-muted">{p.aseguradora}</td>
                <td className="px-4 py-3"><span className="block font-semibold">{fmtFecha(p.hasta)}</span><span className="text-xs text-faint">en {dias} días</span></td>
                <td className="px-4 py-3">{fmtPesos(p.prima)}</td>
                <td className="px-4 py-3"><span className="block font-semibold">{fmtPesos(propuesta)}</span><span className="text-xs text-on-warn">+{Math.round(AJUSTE[p.ramo] * 100)} %</span></td>
                <td className="px-4 py-3"><Badge tone={riesgo === "Alto" ? "danger" : riesgo === "Medio" ? "warn" : "ok"}>{riesgo}</Badge></td>
                <td className="px-4 py-3 text-right">
                  {enGestion ? (
                    <Badge tone="info" icon="sync">En administración</Badge>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => dispatch({ t: "renovacion/recotizar", polizaId: p.id, propuesta })}>Recotizar</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-[13px] text-muted">El riesgo combina los días que faltan con la situación de pago del cliente: quien está en mora tardía tiene más chances de no renovar.</p>
    </div>
  );
}
