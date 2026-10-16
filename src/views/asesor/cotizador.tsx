"use client";

/** Cotizador multi-aseguradora: compara compañías y envía la propuesta por WhatsApp. */
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ICONO_RAMO } from "@/components/ramo";
import { Badge, Button, Card, Field, Icon, Loading, PageHeader, Segmented, cx, inputClass } from "@/components/ui";
import { COBERTURAS, ofertas } from "@/lib/cotizar";
import { fmtPesos } from "@/lib/format";
import { cliente } from "@/lib/rules";
import { ASEGURADORAS } from "@/lib/seed";
import { useDemo } from "@/lib/store";
import { RAMOS, type Ramo } from "@/lib/types";

export function Cotizador() {
  const { s } = useDemo();
  return s ? <CotizadorListo /> : <Loading />;
}

function CotizadorListo() {
  const { s: estado, dispatch } = useDemo();
  const s = estado!;
  const params = useSearchParams();
  const [aviso, setAviso] = useState("");
  const leadParam = params.get("lead");
  const clienteParam = params.get("cliente");
  const ramoParam = params.get("ramo") as Ramo | null;

  const lead0 = s.leads.find((l) => l.id === leadParam);
  const [quien, setQuien] = useState<string>(lead0 ? `l:${lead0.id}` : clienteParam ? `c:${clienteParam}` : "");
  const [ramo, setRamo] = useState<Ramo>(lead0?.ramo ?? (ramoParam && RAMOS.includes(ramoParam) ? ramoParam : "Auto"));
  const [cobertura, setCobertura] = useState(COBERTURAS[lead0?.ramo ?? ramoParam ?? "Auto"]?.at(-1)?.id ?? "tr");
  const [bien, setBien] = useState(lead0?.bien ?? "");
  const [elegida, setElegida] = useState<string | null>(null);

  const leads = s.leads.filter((l) => !["Ganada", "Perdida"].includes(l.etapa) && cliente(s, l.clienteId).asesorId === s.asesorActual);
  const clientes = s.clientes.filter((c) => c.asesorId === s.asesorActual && s.polizas.some((p) => p.clienteId === c.id));
  const sel = quien.startsWith("l:") ? s.leads.find((l) => l.id === quien.slice(2)) : null;
  const selCliente = sel ? cliente(s, sel.clienteId) : quien.startsWith("c:") ? s.clientes.find((c) => c.id === quien.slice(2)) : null;
  const lista = ofertas(ramo, cobertura, ramo.length);
  const oferta = lista.find((o) => o.aseguradora === elegida) ?? lista.find((o) => o.recomendada)!;

  const cambiarRamo = (r: Ramo) => {
    setRamo(r);
    setCobertura(COBERTURAS[r].at(-1)!.id);
    setElegida(null);
  };

  const enviar = () => {
    if (!selCliente) return setAviso("Elegí a quién le vas a enviar la cotización.");
    const detalle = bien.trim() || sel?.bien || ramo;
    if (sel) dispatch({ t: "lead/cotizar", leadId: sel.id, aseguradora: oferta.aseguradora, plan: oferta.plan, precio: oferta.precio });
    else dispatch({ t: "cotizacion/nueva", clienteId: selCliente.id, ramo, bien: detalle, aseguradora: oferta.aseguradora, plan: oferta.plan, precio: oferta.precio });
    setAviso(`Listo: le enviaste a ${selCliente.nombre.split(" ")[0]} la propuesta de ${oferta.aseguradora} por WhatsApp. La oportunidad quedó como cotizada.`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Cotizador multi-aseguradora" subtitle={`${selCliente ? `Para ${selCliente.nombre} · ` : ""}Comparando ${ASEGURADORAS.length} compañías`} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-4 p-5">
          <Field label="Para quién">
            <select
              className={inputClass}
              value={quien}
              onChange={(e) => {
                setQuien(e.target.value);
                setAviso("");
                const l = s.leads.find((x) => `l:${x.id}` === e.target.value);
                if (l) {
                  cambiarRamo(l.ramo);
                  setBien(l.bien);
                }
              }}
            >
              <option value="">Elegí un lead o un cliente</option>
              <optgroup label="Oportunidades abiertas">
                {leads.map((l) => (
                  <option key={l.id} value={`l:${l.id}`}>{cliente(s, l.clienteId).nombre} · {l.ramo}</option>
                ))}
              </optgroup>
              <optgroup label="Clientes de tu cartera">
                {clientes.map((c) => (
                  <option key={c.id} value={`c:${c.id}`}>{c.nombre}</option>
                ))}
              </optgroup>
            </select>
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink-2">Ramo</span>
            <div className="grid grid-cols-3 gap-2">
              {RAMOS.map((r) => (
                <button
                  key={r}
                  onClick={() => cambiarRamo(r)}
                  aria-pressed={ramo === r}
                  className={cx("flex flex-col items-center gap-1 rounded-xl border-[1.5px] px-2 py-2.5 text-xs font-semibold", ramo === r ? "border-primary bg-primary-soft text-primary-hover" : "border-line hover:bg-bg")}
                >
                  <Icon name={ICONO_RAMO[r]} size={20} fill />
                  <span className="text-center leading-tight">{r}</span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Qué se asegura">
            <input className={inputClass} value={bien} onChange={(e) => setBien(e.target.value)} placeholder={ramo === "Auto" ? "Toyota Corolla 2021" : ramo === "Hogar" ? "Casa de 120 m² en La Plata" : "Descripción breve"} />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink-2">Cobertura</span>
            <Segmented label="Cobertura" value={cobertura} onChange={(v) => { setCobertura(v); setElegida(null); }} options={COBERTURAS[ramo].map((c) => ({ value: c.id, label: c.label }))} />
            <span className="text-xs text-muted">{COBERTURAS[ramo].find((c) => c.id === cobertura)?.desc}</span>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          {lista.map((o) => {
            const on = o.aseguradora === oferta.aseguradora;
            return (
              <button
                key={o.aseguradora}
                onClick={() => setElegida(o.aseguradora)}
                aria-pressed={on}
                className={cx("flex items-center gap-4 rounded-2xl border-[1.5px] bg-surface p-4 text-left transition-colors", on ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]" : "border-line hover:border-input")}
              >
                <span className={cx("grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-primary" : "border-input")}>
                  {on && <span className="size-2.5 rounded-full bg-primary" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{o.aseguradora}</span>
                    {o.recomendada && <Badge tone="primary" icon="star">Recomendada</Badge>}
                  </div>
                  <div className="text-[13px] text-muted">{o.extra} · Franquicia {o.franquicia}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold">{fmtPesos(o.precio)}</div>
                  <div className="text-xs text-faint">por mes</div>
                </div>
              </button>
            );
          })}
          {aviso && (
            <p role="status" className={cx("rounded-xl p-3 text-sm font-semibold", aviso.startsWith("Listo") ? "bg-ok-soft text-on-ok" : "bg-warn-soft text-on-warn")}>{aviso}</p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" icon="picture_as_pdf" onClick={() => setAviso("Listo: descargaste la comparativa en PDF (en la demo no se genera el archivo).")}>
              Descargar comparativa
            </Button>
            <Button icon="send" onClick={enviar}>Enviar por WhatsApp</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
