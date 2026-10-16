"use client";

/**
 * Prospección con IA (simulada): con un botón, la IA "busca" posibles clientes en
 * fuentes públicas o con consentimiento, los puntúa y el asesor los suma al pipeline.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { RamoTile } from "@/components/ramo";
import { Badge, Button, Card, Empty, Icon, Loading, PageHeader, cx } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { PROSPECTOS_POOL } from "@/lib/seed";

const PASOS_IA = [
  "Buscando señales en fuentes públicas: habilitaciones, clasificados, sitios y redes de empresas…",
  "Cruzando con tu cartera para no repetir clientes…",
  "Puntuando la afinidad de cada prospecto con tus ramos…",
];

export function Prospeccion() {
  const { s, dispatch } = useDemo();
  const [buscando, setBuscando] = useState(false);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (!buscando) return;
    const t = setTimeout(() => {
      if (paso + 1 < PASOS_IA.length) return setPaso(paso + 1);
      dispatch({ t: "ia/buscar" });
      setBuscando(false);
    }, 900);
    return () => clearTimeout(t);
  }, [buscando, paso, dispatch]);

  if (!s) return <Loading />;
  const lista = s.prospectos.filter((p) => p.estado !== "descartado");
  const quedan = PROSPECTOS_POOL.length - s.prospectos.length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Prospección con IA" subtitle="Posibles clientes nuevos, con la señal que los hace interesantes y su nivel de afinidad.">
        <Button
          icon="auto_awesome"
          disabled={buscando || quedan === 0}
          onClick={() => {
            setPaso(0);
            setBuscando(true);
          }}
        >
          {buscando ? "Buscando…" : s.prospectos.length ? "Buscar más prospectos" : "Buscar prospectos con IA"}
        </Button>
      </PageHeader>

      {buscando && (
        <Card className="flex flex-col gap-3 p-5" >
          <span aria-live="polite" className="flex items-center gap-2 text-sm font-semibold text-primary-hover">
            <Icon name="auto_awesome" size={18} fill /> {PASOS_IA[Math.min(paso, PASOS_IA.length - 1)]}
          </span>
          <span className="h-1.5 overflow-hidden rounded-full bg-primary-soft">
            <span className="animate-scan block h-full w-2/5 rounded-full bg-primary" />
          </span>
        </Card>
      )}

      {!buscando && lista.length === 0 && (
        <Card>
          <Empty icon="travel_explore" title="Todavía no buscaste prospectos">
            Tocá &quot;Buscar prospectos con IA&quot;: en segundos vas a tener una lista de posibles clientes listos para contactar.
          </Empty>
        </Card>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
        {lista.map((p) => (
          <Card key={p.id} className="flex flex-col gap-3.5 p-4">
            <div className="flex items-start gap-3">
              <RamoTile ramo={p.ramo} />
              <div className="min-w-0 flex-1">
                <span className="block font-bold">{p.nombre}</span>
                <span className="block text-[13px] text-muted">{p.ciudad} · {p.ramo} · {p.bien}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-extrabold">{p.afinidad} %</span>
                <span className="text-[11px] font-semibold text-faint">afinidad</span>
              </div>
            </div>
            <span className="h-1.5 overflow-hidden rounded-full bg-segment">
              <span className={cx("block h-full rounded-full", p.afinidad >= 80 ? "bg-ok" : p.afinidad >= 70 ? "bg-primary" : "bg-warn")} style={{ width: `${p.afinidad}%` }} />
            </span>
            <div className="rounded-xl bg-bg p-3 text-sm">
              <span className="block text-xs font-semibold text-faint">Señal detectada</span>
              {p.senal}
              <span className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                <Icon name="link" size={14} /> Fuente: {p.fuente}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">{p.telefono} · {p.email}</span>
              {p.estado === "nuevo" ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => dispatch({ t: "ia/descartar", prospectoId: p.id })}>Descartar</Button>
                  <Button size="sm" icon="person_add" onClick={() => dispatch({ t: "ia/agregar", prospectoId: p.id })}>Agregar como lead</Button>
                </div>
              ) : (
                <Link href="/asesor/pipeline" className="flex items-center gap-1 text-sm font-semibold text-on-ok">
                  <Badge tone="ok" icon="check">En tu pipeline</Badge>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex gap-3 bg-bg p-4 text-[13px] leading-relaxed text-muted">
        <Icon name="shield_person" size={22} className="text-primary" />
        <p>
          <strong className="text-ink">Simulación.</strong> En la versión real, la IA trabajaría solo con fuentes públicas y datos que las personas aceptaron compartir,
          respetando la Ley 25.326 de Protección de Datos Personales. Nunca con información sensible, y siempre con la opción de pedir la baja.
        </p>
      </Card>
    </div>
  );
}
