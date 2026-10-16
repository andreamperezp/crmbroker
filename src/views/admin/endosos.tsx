"use client";

/** Endosos y modificaciones: cambios a pólizas vigentes que hay que aprobar o rechazar. */
import { codigo, abierta } from "./tramites";
import { Badge, Button, Card, Empty, Loading, PageHeader } from "@/components/ui";
import { fmtFecha, fmtPesos } from "@/lib/format";
import { cliente, poliza } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS } from "@/lib/types";

export function Endosos() {
  const { s, dispatch } = useDemo();
  if (!s) return <Loading />;
  const lista = s.gestiones.filter((g) => g.tipo === "Endoso" || g.tipo === "Baja").sort((a, b) => Number(abierta(b)) - Number(abierta(a)));
  const pendientes = lista.filter(abierta);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Endosos y modificaciones" subtitle={`${pendientes.length} pendientes de aprobación · cambios de datos, coberturas y bajas`} />
      {lista.length === 0 && <Card><Empty icon="edit_document" title="No hay endosos">Los cambios que piden los clientes aparecen acá.</Empty></Card>}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        {lista.map((g) => {
          const pol = poliza(s, g.polizaId);
          const pendiente = abierta(g);
          const diferencia = pol ? Math.round((pol.prima * (g.tipo === "Baja" ? -1 : 0.08)) / 100) * 100 : 0;
          return (
            <Card key={g.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-faint">{codigo(g)} · Póliza {pol?.numero ?? "—"}</span>
                <Badge tone={g.rechazada ? "danger" : pendiente ? "warn" : "ok"}>{g.rechazada ? "Rechazado" : pendiente ? "Pendiente" : "Aplicado"}</Badge>
              </div>
              <div>
                <div className="font-bold">{g.tipo === "Baja" ? "Pedido de baja" : "Endoso"} · {g.ramo}</div>
                <div className="text-sm text-muted">{cliente(s, g.clienteId).nombre} · pedido el {fmtFecha(g.creada)}</div>
              </div>
              <p className="text-sm">{g.detalle}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
                <span className="text-[13px] text-muted">
                  Impacto en la prima: <strong className={diferencia < 0 ? "text-on-danger" : "text-ink"}>{diferencia === 0 ? "sin cambios" : `${diferencia > 0 ? "+" : ""}${fmtPesos(diferencia)}/mes`}</strong>
                </span>
                {pendiente && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" onClick={() => dispatch({ t: "gestion/rechazar", gestionId: g.id })}>Rechazar</Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!g.responsable) dispatch({ t: "gestion/tomar", gestionId: g.id });
                        g.checks.forEach((ok, i) => !ok && dispatch({ t: "gestion/check", gestionId: g.id, i }));
                        for (let i = g.paso; i < PASOS[g.tipo].length - 1; i++) dispatch({ t: "gestion/avanzar", gestionId: g.id });
                      }}
                    >
                      Aprobar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
