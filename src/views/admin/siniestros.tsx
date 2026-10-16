"use client";

/** Gestión de siniestros: de la denuncia a la liquidación, con la documentación a la vista. */
import { useState } from "react";
import { Detalle, abierta, codigo } from "./tramites";
import { Badge, Card, Chip, Empty, Loading, PageHeader, cx } from "@/components/ui";
import { fmtPesos } from "@/lib/format";
import { cliente } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS } from "@/lib/types";

export function Siniestros() {
  const { s } = useDemo();
  const [sel, setSel] = useState<string | null>(null);
  const [ver, setVer] = useState<"abiertos" | "liquidados">("abiertos");
  if (!s) return <Loading />;

  const todos = s.gestiones.filter((g) => g.tipo === "Siniestro").sort((a, b) => b.creada.localeCompare(a.creada));
  const lista = todos.filter((g) => (ver === "abiertos" ? abierta(g) : !abierta(g)));
  const actual = lista.find((g) => g.id === sel) ?? lista[0];
  const enCurso = todos.filter(abierta);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Gestión de siniestros" subtitle={`${enCurso.length} en curso · ${fmtPesos(enCurso.reduce((t, g) => t + (g.monto ?? 0), 0))} estimados en reclamos`} />
      <div className="flex gap-2">
        <Chip active={ver === "abiertos"} onClick={() => setVer("abiertos")} count={enCurso.length}>En curso</Chip>
        <Chip active={ver === "liquidados"} onClick={() => setVer("liquidados")} count={todos.length - enCurso.length}>Liquidados</Chip>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Card className="h-fit divide-y divide-line-soft">
          {lista.length === 0 && <Empty icon="car_crash" title={ver === "abiertos" ? "No hay siniestros en curso" : "Todavía no hay siniestros liquidados"}>Cuando un cliente denuncia uno desde la autogestión, aparece acá.</Empty>}
          {lista.map((g) => (
            <button key={g.id} onClick={() => setSel(g.id)} aria-pressed={actual?.id === g.id} className={cx("flex w-full flex-col gap-1 p-4 text-left", actual?.id === g.id ? "bg-primary-soft/60" : "hover:bg-bg")}>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">{cliente(s, g.clienteId).nombre}</span>
                <Badge tone={abierta(g) ? "info" : "ok"}>{PASOS.Siniestro[g.paso]}</Badge>
              </span>
              <span className="text-[13px] text-muted">{codigo(g).replace("TR", "SIN")} · {g.detalle.split(".")[0]} · {g.ramo}</span>
              {g.monto && <span className="text-xs font-semibold text-faint">Estimado {fmtPesos(g.monto)}</span>}
            </button>
          ))}
        </Card>
        {actual && <Detalle key={actual.id} s={s} g={actual} />}
      </div>
    </div>
  );
}
