"use client";

/** Autogestión: el portal del cliente, en web o en el celular. */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { abierta, codigo } from "@/views/admin/tramites";
import { ICONO_RAMO, RamoTile } from "@/components/ramo";
import { Avatar, Badge, Button, Card, Field, Icon, Segmented, Steps, cx, inputClass } from "@/components/ui";
import { addDays, fmtFecha, fmtFechaLarga, fmtPesos } from "@/lib/format";
import { COBERTURAS, ofertas, type Oferta } from "@/lib/cotizar";
import { asesor, atraso, cliente, deudaDe, estadoCuota, estadoPoliza } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS, RAMOS, type Estado, type Poliza, type Ramo } from "@/lib/types";

type Tab = "polizas" | "pagar" | "siniestro" | "certificados" | "cotizar" | "chat";
const TABS: { id: Tab; label: string; corto: string; icon: string }[] = [
  { id: "polizas", label: "Mis pólizas", corto: "Inicio", icon: "shield" },
  { id: "pagar", label: "Pagar", corto: "Pagar", icon: "credit_card" },
  { id: "siniestro", label: "Siniestro", corto: "Siniestro", icon: "car_crash" },
  { id: "certificados", label: "Certificados", corto: "Papeles", icon: "description" },
  { id: "cotizar", label: "Cotizar", corto: "Cotizar", icon: "request_quote" },
  { id: "chat", label: "Chat", corto: "Chat", icon: "chat" },
];
const MOVIL_TABS: Tab[] = ["polizas", "pagar", "siniestro", "cotizar", "chat"];

interface VistaProps {
  s: Estado;
  cid: string;
  go: (t: Tab) => void;
  movil: boolean;
}

/** En un celular de verdad, el portal se ve siempre en su versión mobile */
const angosta = "(max-width: 639px)";
function useCelular() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(angosta);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(angosta).matches,
    () => false,
  );
}

export function Portal({ s, cid }: { s: Estado; cid: string }) {
  const movil = useCelular() || s.movil;
  const { dispatch } = useDemo();
  const [tab, setTab] = useState<Tab>("polizas");
  const scroller = useRef<HTMLDivElement>(null);
  const c = cliente(s, cid);
  const nombre = c.nombre.split(" ")[0];
  const deuda = deudaDe(s, cid);
  const sinLeer = s.mensajes.filter((m) => m.clienteId === cid && m.de !== "cliente" && m.fecha === s.hoy).length;

  const go = (t: Tab) => {
    setTab(t);
    scroller.current?.scrollTo({ top: 0 });
    if (!movil) window.scrollTo({ top: 0 });
  };
  const props: VistaProps = { s, cid, go, movil };
  const contenido = {
    polizas: <Polizas {...props} />,
    pagar: <Pagar {...props} />,
    siniestro: <Siniestro {...props} />,
    certificados: <Certificados {...props} />,
    cotizar: <Cotizar {...props} />,
    chat: <Chat {...props} />,
  }[tab];
  const salir = (
    <button onClick={() => dispatch({ t: "cliente/elegir", id: "" })} className="text-[13px] font-semibold text-primary-light hover:text-white">
      Cambiar de cliente
    </button>
  );

  if (movil)
    return (
      <div className="flex justify-center sm:py-2">
        <div className="flex h-[min(812px,calc(100dvh-7rem))] w-full max-w-[390px] flex-col overflow-hidden bg-bg sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-2xl max-sm:-mx-4 max-sm:h-[calc(100dvh-8rem)] max-sm:w-[calc(100%+2rem)] max-sm:max-w-none">
          <div className="hidden items-center justify-between bg-ink px-6 pt-2.5 pb-1 text-xs font-semibold text-white sm:flex" aria-hidden="true">
            <span>9:41</span>
            <span className="flex gap-1"><Icon name="signal_cellular_alt" size={14} /><Icon name="wifi" size={14} /><Icon name="battery_full" size={14} /></span>
          </div>
          <div className="flex items-center justify-between bg-ink px-5 pt-2 pb-4 text-white">
            <div>
              <div className="text-xs font-medium text-primary-light">Mi portal de seguros</div>
              <div className="text-xl font-bold">Hola, {nombre}</div>
            </div>
            {salir}
          </div>
          <div ref={scroller} className="flex-1 overflow-y-auto p-4">{contenido}</div>
          <nav aria-label="Secciones" className="grid grid-cols-5 border-t border-line bg-surface px-1 pt-1.5 pb-3">
            {MOVIL_TABS.map((id) => {
              const t = TABS.find((x) => x.id === id)!;
              const on = tab === id || (id === "polizas" && tab === "certificados");
              return (
                <button key={id} onClick={() => go(id)} aria-current={on ? "page" : undefined} className={cx("relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold", on ? "text-primary" : "text-faint")}>
                  <Icon name={t.icon} size={24} fill={on} />
                  {t.corto}
                  {id === "pagar" && deuda.cuotas.length > 0 && <span className="absolute top-0.5 right-[calc(50%-18px)] size-2 rounded-full bg-danger" aria-label="Tenés cuotas vencidas" />}
                  {id === "chat" && sinLeer > 0 && <span className="absolute top-0.5 right-[calc(50%-18px)] size-2 rounded-full bg-primary" aria-label="Mensajes nuevos" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[18px] bg-ink p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold text-primary-light">Mi portal de seguros</div>
            <h1 className="m-0 mt-0.5 text-[28px] font-bold tracking-[-0.01em]">Hola, {nombre}</h1>
          </div>
          {salir}
        </div>
        <nav aria-label="Secciones" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={cx("relative flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-sm font-semibold", tab === t.id ? "bg-surface text-ink" : "text-white/80 hover:bg-white/10 hover:text-white")}>
              <Icon name={t.icon} size={19} fill={tab === t.id} />
              {t.label}
              {t.id === "pagar" && deuda.cuotas.length > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">{deuda.cuotas.length}</span>}
            </button>
          ))}
        </nav>
      </div>
      {contenido}
    </div>
  );
}

/* ---------- Mis pólizas ---------- */

function Polizas({ s, cid, go, movil }: VistaProps) {
  const pols = s.polizas.filter((p) => p.clienteId === cid);
  const deuda = deudaDe(s, cid);
  const plan = s.planes.find((p) => p.clienteId === cid);
  const tramites = s.gestiones.filter((g) => g.clienteId === cid && abierta(g));
  const leads = s.leads.filter((l) => l.clienteId === cid && !["Ganada", "Perdida"].includes(l.etapa));
  const a = asesor(s, cliente(s, cid).asesorId);
  const tardia = deuda.dias > 30;

  return (
    <div className="flex flex-col gap-4">
      {deuda.cuotas.length > 0 && (
        <div role="alert" className={cx("flex flex-wrap items-center gap-3 rounded-2xl p-4", tardia ? "bg-danger-soft text-on-danger" : "bg-warn-soft text-on-warn")}>
          <Icon name={tardia ? "error" : "schedule"} fill size={24} />
          <div className="min-w-0 flex-1">
            <div className="font-bold">{deuda.cuotas.length === 1 ? "Tenés una cuota vencida" : `Tenés ${deuda.cuotas.length} cuotas vencidas`} · {fmtPesos(deuda.total)}</div>
            <div className="text-[13px]">{tardia ? "Pasaron más de 30 días: tu cobertura puede suspenderse. Pagá o pedí un plan de pago." : `Hace ${deuda.dias} días. Pagala hoy y seguís cubierto sin problemas.`}</div>
          </div>
          <Button size="sm" variant={tardia ? "primary" : "emphasis"} onClick={() => go("pagar")}>Pagar ahora</Button>
        </div>
      )}
      {plan && (
        <div className="flex items-center gap-3 rounded-2xl bg-info-soft p-4 text-on-info">
          <Icon name="calendar_month" fill size={24} />
          <div className="text-[13px]"><b>Tenés un plan de pago activo:</b> {plan.cuotas.length} cuotas de {fmtPesos(plan.cuotas[0].monto)}, la primera el {fmtFecha(plan.cuotas[0].fecha)}. Tu cobertura sigue vigente.</div>
        </div>
      )}

      {pols.length === 0 ? (
        <Card className="flex flex-col gap-3 p-5">
          <IconTile2 />
          <h2 className="m-0 text-lg font-bold">Todavía no tenés pólizas</h2>
          <p className="text-sm text-muted">{a.nombre} ya tiene tu pedido y te va a escribir para ayudarte. Mientras tanto, podés comparar precios vos mismo.</p>
          <div className="flex flex-wrap gap-2">
            <Button icon="request_quote" onClick={() => go("cotizar")}>Cotizar ahora</Button>
            <Button variant="secondary" icon="chat" onClick={() => go("chat")}>Hablar con {a.nombre.split(" ")[0]}</Button>
          </div>
        </Card>
      ) : (
        <div className={cx("grid gap-3.5", !movil && "grid-cols-[repeat(auto-fill,minmax(290px,1fr))]")}>
          {pols.map((p) => <PolizaCard key={p.id} s={s} p={p} go={go} />)}
        </div>
      )}

      {(tramites.length > 0 || leads.length > 0) && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="m-0 text-base font-bold">En curso</h2>
          {tramites.map((g) => (
            <div key={g.id} className="flex flex-col gap-2 border-t border-line-soft pt-3 first-of-type:border-0 first-of-type:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold">{g.tipo} · {g.ramo}</span>
                <span className="text-xs text-faint">{codigo(g)}</span>
              </div>
              <Steps steps={PASOS[g.tipo]} current={g.paso} />
            </div>
          ))}
          {leads.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 border-t border-line-soft pt-3 text-sm">
              <span><b>Cotización de {l.ramo.toLowerCase()}</b><span className="block text-xs text-muted">{l.cotizacion ? `${l.cotizacion.aseguradora} · ${fmtPesos(l.cotizacion.precio)}/mes` : l.bien}</span></span>
              <Badge tone={l.etapa === "Negociación" ? "ok" : "info"}>{l.etapa === "Negociación" ? "Elegiste plan" : l.etapa === "Cotizada" ? "Propuesta enviada" : "Tu asesora la está armando"}</Badge>
            </div>
          ))}
        </Card>
      )}

      <Card className="flex items-center gap-3 p-4">
        <Avatar nombre={a.nombre} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-faint">Tu asesora</div>
          <div className="font-bold">{a.nombre}</div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-on-ok"><span className="size-2 rounded-full bg-ok" /> Responde en el día · {a.zona}</div>
        </div>
        <Button size="sm" variant="secondary" icon="chat" onClick={() => go("chat")}>Escribirle</Button>
      </Card>
    </div>
  );
}

function IconTile2() {
  return <span className="grid size-12 place-items-center rounded-[13px] bg-primary-soft text-primary"><Icon name="shield" fill size={26} /></span>;
}

function PolizaCard({ s, p, go }: { s: Estado; p: Poliza; go: (t: Tab) => void }) {
  const estado = estadoPoliza(p, s.hoy);
  const prox = s.cuotas.filter((q) => q.polizaId === p.id && !q.pagada && !q.planId).sort((a, b) => a.vence.localeCompare(b.vence))[0];
  const eq = prox && estadoCuota(prox, s.hoy);
  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex items-start gap-3">
        <RamoTile ramo={p.ramo} size={44} />
        <div className="min-w-0 flex-1">
          <div className="font-bold">{p.ramo}</div>
          <div className="truncate text-[13px] text-muted">{p.bien}</div>
        </div>
        <Badge tone={estado === "Vigente" ? "ok" : estado === "Por renovar" ? "warn" : "danger"}>{estado}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2.5 text-[13px]">
        <span><span className="block text-xs text-faint">Aseguradora</span><b>{p.aseguradora}</b></span>
        <span><span className="block text-xs text-faint">Póliza</span><b>{p.numero}</b></span>
        <span><span className="block text-xs text-faint">Vigente hasta</span><b>{fmtFecha(p.hasta)}</b></span>
        <span><span className="block text-xs text-faint">Cuota mensual</span><b>{fmtPesos(p.prima)}</b></span>
      </div>
      {prox && (
        <div className={cx("flex items-center justify-between rounded-xl px-3 py-2 text-[13px]", eq?.startsWith("Mora") ? "bg-danger-soft text-on-danger" : eq === "Vence hoy" ? "bg-warn-soft text-on-warn" : "bg-bg text-muted")}>
          <span>Cuota {prox.nro} · {eq?.startsWith("Mora") ? `vencida hace ${atraso(prox, s.hoy)} días` : eq === "Vence hoy" ? "vence hoy" : `vence el ${fmtFecha(prox.vence)}`}</span>
          <b>{fmtPesos(prox.monto)}</b>
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon="description" className="flex-1" onClick={() => go("certificados")}>Certificado</Button>
        <Button size="sm" variant="secondary" icon="car_crash" className="flex-1" onClick={() => go("siniestro")}>Siniestro</Button>
      </div>
    </Card>
  );
}

/* ---------- Pagar ---------- */

const MEDIOS = [
  { id: "Mercado Pago", icon: "account_balance_wallet" },
  { id: "Tarjeta de crédito", icon: "credit_card" },
  { id: "Tarjeta de débito", icon: "credit_card" },
  { id: "Transferencia", icon: "account_balance" },
];

function Pagar({ s, cid, go, movil }: VistaProps) {
  const { dispatch } = useDemo();
  const impagas = s.cuotas
    .filter((q) => q.clienteId === cid && !q.pagada && !q.planId && q.vence <= addDays(s.hoy, 30))
    .sort((a, b) => a.vence.localeCompare(b.vence));
  const [sel, setSel] = useState<string[]>(() => impagas.filter((q) => q.vence <= s.hoy).map((q) => q.id));
  const [medio, setMedio] = useState("Mercado Pago");
  const [pagado, setPagado] = useState<{ n: number; total: number } | null>(null);
  const plan = s.planes.find((p) => p.clienteId === cid);
  const total = impagas.filter((q) => sel.includes(q.id)).reduce((t, q) => t + q.monto, 0);

  if (pagado)
    return (
      <Card className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-ok-soft text-on-ok"><Icon name="check_circle" fill size={32} /></span>
        <h2 className="m-0 text-xl font-bold">¡Listo, pago recibido!</h2>
        <p className="text-sm text-muted">Pagaste {pagado.n} {pagado.n === 1 ? "cuota" : "cuotas"} por {fmtPesos(pagado.total)} con {medio}. Ya lo ve el equipo de cobranzas y te llega el comprobante por mail.</p>
        <Button variant="secondary" onClick={() => go("polizas")}>Volver a mis pólizas</Button>
      </Card>
    );

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
      {!movil && <h2 className="m-0 text-[22px] font-bold">Pagar cuotas</h2>}
      {impagas.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-8 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-ok-soft text-on-ok"><Icon name="verified" fill size={28} /></span>
          <span className="font-bold">Estás al día</span>
          <span className="text-sm text-muted">{plan ? `Tu plan de pago sigue en marcha: la próxima cuota es el ${fmtFecha(plan.cuotas[0].fecha)}.` : "No tenés cuotas para pagar en los próximos 30 días."}</span>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-1 p-2">
            {impagas.map((q) => {
              const p = s.polizas.find((x) => x.id === q.polizaId)!;
              const on = sel.includes(q.id);
              const vencida = q.vence < s.hoy;
              return (
                <label key={q.id} className={cx("flex cursor-pointer items-center gap-3 rounded-xl p-3", on ? "bg-primary-soft/60" : "hover:bg-bg")}>
                  <input type="checkbox" checked={on} onChange={() => setSel(on ? sel.filter((x) => x !== q.id) : [...sel, q.id])} className="size-5 accent-[var(--primary)]" />
                  <Icon name={ICONO_RAMO[p.ramo]} className="text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{p.ramo} · cuota {q.nro}</span>
                    <span className={cx("block text-xs", vencida ? "font-semibold text-on-danger" : "text-muted")}>{vencida ? `Vencida hace ${atraso(q, s.hoy)} días` : `Vence el ${fmtFecha(q.vence)}`}</span>
                  </span>
                  <span className="font-bold tabular-nums">{fmtPesos(q.monto)}</span>
                </label>
              );
            })}
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <span className="text-[13px] font-semibold text-ink-2">¿Cómo querés pagar?</span>
            <div className="grid grid-cols-2 gap-2.5">
              {MEDIOS.map((m) => (
                <button key={m.id} onClick={() => setMedio(m.id)} aria-pressed={medio === m.id} className={cx("flex items-center gap-2 rounded-xl border-[1.5px] p-3 text-left text-[13px] font-semibold", medio === m.id ? "border-primary bg-primary-soft/50 text-ink" : "border-line text-ink-2 hover:bg-bg")}>
                  <Icon name={m.icon} size={20} className="text-primary" /> {m.id}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between border-t border-line-soft pt-3">
              <span className="text-sm text-muted">Total a pagar</span>
              <span className="text-[28px] font-extrabold tabular-nums">{fmtPesos(total)}</span>
            </div>
            <Button
              size="lg"
              icon="lock"
              disabled={sel.length === 0}
              onClick={() => {
                sel.forEach((id) => dispatch({ t: "cliente/pagar", cuotaId: id, medio }));
                setPagado({ n: sel.length, total });
              }}
            >
              Pagar {fmtPesos(total)}
            </Button>
            <span className="text-center text-xs text-faint">Demo: no se cobra nada ni se pide ningún dato de tarjeta.</span>
          </Card>
        </>
      )}
      <div className="flex gap-3 rounded-2xl bg-warn-soft p-4 text-[13px] text-[#7A4A00]">
        <Icon name="lightbulb" fill size={20} className="text-on-warn" />
        <span><b>Tip:</b> adherite al débito automático y no te preocupás más por los vencimientos. Pedíselo a tu asesora por el chat.</span>
      </div>
    </div>
  );
}

/* ---------- Siniestro ---------- */

const QUE: Record<Ramo, string[]> = {
  Auto: ["Choque", "Robo", "Rotura de cristales", "Granizo"],
  Hogar: ["Robo", "Daño por agua", "Incendio", "Rotura de electrodomésticos"],
  Vida: ["Fallecimiento", "Enfermedad grave"],
  Comercio: ["Robo", "Incendio", "Daño por agua", "Accidente de un cliente"],
  "Accidentes personales": ["Accidente", "Internación"],
};
const FOTOS = ["Vista general", "Daño de cerca", "Documento", "Otra"];

function Siniestro({ s, cid, go, movil }: VistaProps) {
  const { dispatch } = useDemo();
  const pols = s.polizas.filter((p) => p.clienteId === cid);
  const [paso, setPaso] = useState(0);
  const [polId, setPolId] = useState(pols[0]?.id ?? "");
  const pol = pols.find((p) => p.id === polId);
  const [que, setQue] = useState(pol ? QUE[pol.ramo][0] : "");
  const [cuando, setCuando] = useState(s.hoy);
  const [donde, setDonde] = useState("");
  const [relato, setRelato] = useState("");
  const [fotos, setFotos] = useState<boolean[]>([false, false, false, false]);
  const [listo, setListo] = useState(false);
  const enCurso = s.gestiones.filter((g) => g.clienteId === cid && g.tipo === "Siniestro" && abierta(g));

  if (!pol)
    return <Card className="p-6 text-center text-sm text-muted">Cuando tengas una póliza, vas a poder denunciar un siniestro desde acá.</Card>;

  if (listo)
    return (
      <Card className="mx-auto flex w-full max-w-[640px] flex-col gap-4 p-6">
        <span className="grid size-14 place-items-center rounded-full bg-ok-soft text-on-ok"><Icon name="check_circle" fill size={32} /></span>
        <h2 className="m-0 text-xl font-bold">Recibimos tu denuncia</h2>
        <p className="text-sm text-muted">Ya la tiene el equipo de administración. Te vamos avisando cada paso por acá y por WhatsApp.</p>
        <ol className="flex flex-col gap-2.5 text-sm">
          {["Revisamos la denuncia y las fotos (hoy)", `La presentamos en ${pol.aseguradora} (1 a 3 días)`, "Te contactamos para coordinar la inspección o el pago"].map((t, i) => (
            <li key={t} className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>{t}</li>
          ))}
        </ol>
        <Button variant="secondary" onClick={() => go("polizas")}>Volver a mis pólizas</Button>
      </Card>
    );

  const puede = [!!que, relato.trim().length >= 10, true][paso];
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
      {!movil && <h2 className="m-0 text-[22px] font-bold">Denunciar un siniestro</h2>}
      {enCurso.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-info-soft p-3 text-[13px] text-on-info">
          <Icon name="info" size={18} /> Ya tenés {enCurso.length === 1 ? "un siniestro en curso" : `${enCurso.length} siniestros en curso`}: {enCurso.map((g) => `${codigo(g)} (${PASOS.Siniestro[g.paso]})`).join(", ")}.
        </div>
      )}
      <Steps steps={["Qué pasó", "Cuándo y dónde", "Fotos"]} current={paso} />
      <Card className="flex flex-col gap-4 p-5">
        {paso === 0 && (
          <>
            <Field label="¿Con qué póliza?">
              <select className={inputClass} value={polId} onChange={(e) => { setPolId(e.target.value); setQue(QUE[pols.find((p) => p.id === e.target.value)!.ramo][0]); }}>
                {pols.map((p) => <option key={p.id} value={p.id}>{p.ramo} · {p.bien}</option>)}
              </select>
            </Field>
            <span className="text-[13px] font-semibold text-ink-2">¿Qué pasó?</span>
            <div className="grid grid-cols-2 gap-2.5">
              {QUE[pol.ramo].map((q) => (
                <button key={q} onClick={() => setQue(q)} aria-pressed={que === q} className={cx("rounded-xl border-[1.5px] p-3 text-left text-sm font-semibold", que === q ? "border-primary bg-primary-soft/50" : "border-line hover:bg-bg")}>{q}</button>
              ))}
            </div>
          </>
        )}
        {paso === 1 && (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              <Field label="Fecha"><input type="date" className={inputClass} value={cuando} max={s.hoy} onChange={(e) => setCuando(e.target.value)} /></Field>
              <Field label="Lugar" hint="Opcional"><input className={inputClass} value={donde} onChange={(e) => setDonde(e.target.value)} placeholder="Av. 7 y 50, La Plata" /></Field>
            </div>
            <Field label="Contanos qué pasó" hint="Con tus palabras, como se lo contarías a alguien.">
              <textarea className={cx(inputClass, "h-28 py-2")} value={relato} onChange={(e) => setRelato(e.target.value)} placeholder="Estaba estacionado y…" />
            </Field>
          </>
        )}
        {paso === 2 && (
          <>
            <span className="text-[13px] font-semibold text-ink-2">Sumá fotos (ayudan a que salga más rápido)</span>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {FOTOS.map((f, i) => (
                <button key={f} onClick={() => setFotos(fotos.map((x, k) => (k === i ? !x : x)))} aria-pressed={fotos[i]} className={cx("flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed text-xs font-semibold", fotos[i] ? "border-ok bg-ok-soft text-on-ok" : "border-input text-muted hover:bg-bg")}>
                  <Icon name={fotos[i] ? "check_circle" : "add_a_photo"} fill={fotos[i]} size={26} />
                  {fotos[i] ? "Cargada" : f}
                </button>
              ))}
            </div>
            <div className="rounded-xl bg-bg p-3 text-[13px] text-muted">
              <b className="text-ink">{que}</b> · {pol.ramo} ({pol.bien}) · {fmtFechaLarga(cuando)}{donde && ` · ${donde}`}
            </div>
          </>
        )}
        <div className="flex justify-between gap-2">
          <Button variant="ghost" icon="arrow_back" disabled={paso === 0} onClick={() => setPaso(paso - 1)}>Atrás</Button>
          {paso < 2 ? (
            <Button disabled={!puede} onClick={() => setPaso(paso + 1)}>Siguiente</Button>
          ) : (
            <Button
              icon="send"
              onClick={() => {
                const n = fotos.filter(Boolean).length;
                dispatch({ t: "cliente/siniestro", polizaId: pol.id, que, cuando: fmtFechaLarga(cuando), descripcion: `${relato.trim()}${donde ? ` Lugar: ${donde}.` : ""}${n ? ` Adjuntó ${n} ${n === 1 ? "foto" : "fotos"}.` : ""}` });
                setListo(true);
              }}
            >
              Enviar denuncia
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- Certificados ---------- */

function Certificados({ s, cid, movil }: VistaProps) {
  const [aviso, setAviso] = useState("");
  const pols = s.polizas.filter((p) => p.clienteId === cid && estadoPoliza(p, s.hoy) !== "Vencida");
  const docs = s.documentos.filter((d) => d.clienteId === cid).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const bajar = (n: string) => setAviso(`Descargaste "${n}" (en la demo no se genera el archivo).`);
  const c = cliente(s, cid);
  return (
    <div className="flex flex-col gap-4">
      {!movil && <h2 className="m-0 text-[22px] font-bold">Certificados y papeles</h2>}
      {aviso && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-on-ok">{aviso}</p>}
      <div className={cx("grid gap-3.5", !movil && "grid-cols-[repeat(auto-fill,minmax(290px,1fr))]")}>
        {pols.map((p) => (
          <div key={p.id} className="flex flex-col gap-3 rounded-[18px] bg-ink p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold"><Icon name={ICONO_RAMO[p.ramo]} fill size={20} className="text-primary-light" />Certificado de cobertura</span>
              <span className="text-xs font-semibold text-primary-light">{p.aseguradora}</span>
            </div>
            <div>
              <div className="text-lg font-bold">{c.nombre}</div>
              <div className="text-[13px] text-white/70">{p.bien} · {p.numero}</div>
            </div>
            <div className="text-xs font-medium text-primary-light">Vigente del {fmtFecha(p.desde)} al {fmtFecha(p.hasta)}</div>
            <button onClick={() => bajar(`Certificado ${p.numero}`)} className="flex h-9 items-center justify-center gap-1.5 rounded-[10px] bg-white/10 text-[13px] font-semibold hover:bg-white/20">
              <Icon name="download" size={18} /> Descargar PDF
            </button>
          </div>
        ))}
      </div>
      {docs.length > 0 && (
        <Card className="flex flex-col p-2">
          {docs.map((d) => (
            <button key={d.id} onClick={() => bajar(d.nombre)} className="flex items-center gap-3 rounded-xl p-3 text-left hover:bg-bg">
              <Icon name={d.tipo === "Fotos" ? "image" : "draft"} className="text-primary" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{d.nombre}</span><span className="text-xs text-faint">{d.tipo} · {fmtFecha(d.fecha)}</span></span>
              <Icon name="download" size={19} className="text-muted" />
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ---------- Cotizar ---------- */

const BIEN: Record<Ramo, string> = { Auto: "Marca, modelo y año", Hogar: "Barrio y tipo de vivienda", Vida: "Edad y si sumás beneficiarios", Comercio: "Rubro y metros del local", "Accidentes personales": "Tu actividad" };

function Cotizar({ s, cid, go, movil }: VistaProps) {
  const { dispatch } = useDemo();
  const [ramo, setRamo] = useState<Ramo>("Hogar");
  const [cob, setCob] = useState(COBERTURAS.Hogar[1]?.id ?? COBERTURAS.Hogar[0].id);
  const [bien, setBien] = useState("");
  const [lista, setLista] = useState<Oferta[] | null>(null);
  const [listo, setListo] = useState<string | null>(null);
  const a = asesor(s, cliente(s, cid).asesorId).nombre.split(" ")[0];

  if (listo)
    return (
      <Card className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 p-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-ok-soft text-on-ok"><Icon name="check_circle" fill size={32} /></span>
        <h2 className="m-0 text-xl font-bold">¡Buenísimo!</h2>
        <p className="text-sm text-muted">{listo}</p>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => go("polizas")}>Ver mis pólizas</Button><Button variant="ghost" onClick={() => { setListo(null); setLista(null); }}>Cotizar otra cosa</Button></div>
      </Card>
    );

  const detalle = bien.trim() || `Mi ${ramo.toLowerCase()}`;
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      {!movil && <div><h2 className="m-0 text-[22px] font-bold">Cotizar un seguro nuevo</h2><p className="text-[15px] text-muted">Compará 5 aseguradoras en segundos. Elegís vos, y {a} se ocupa del resto.</p></div>}
      <div className={cx("grid gap-2.5", movil ? "grid-cols-3" : "grid-cols-[repeat(auto-fill,minmax(104px,1fr))]")}>
        {RAMOS.map((r) => (
          <button key={r} onClick={() => { setRamo(r); setLista(null); setCob(COBERTURAS[r][1]?.id ?? COBERTURAS[r][0].id); }} aria-pressed={ramo === r} className={cx("flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] p-3 text-center text-xs font-semibold", ramo === r ? "border-primary bg-primary-soft/50" : "border-line bg-surface hover:bg-bg")}>
            <Icon name={ICONO_RAMO[r]} fill size={26} className="text-primary" />
            {r === "Accidentes personales" ? "Accidentes" : r}
          </button>
        ))}
      </div>
      <Card className="flex flex-col gap-4 p-5">
        <Field label={BIEN[ramo]}><input className={inputClass} value={bien} onChange={(e) => setBien(e.target.value)} placeholder={ramo === "Auto" ? "Fiat Cronos 2022" : ramo === "Hogar" ? "Departamento en City Bell" : ""} /></Field>
        <span className="text-[13px] font-semibold text-ink-2">Cobertura</span>
        <Segmented label="Cobertura" value={cob} onChange={(v) => { setCob(v); setLista(null); }} options={COBERTURAS[ramo].map((c) => ({ value: c.id, label: c.label }))} />
        <span className="-mt-2 text-xs text-muted">{COBERTURAS[ramo].find((c) => c.id === cob)?.desc}</span>
        <Button icon="bolt" onClick={() => setLista(ofertas(ramo, cob, cid.length))}>Ver precios</Button>
      </Card>
      {lista && (
        <div className="flex flex-col gap-2.5">
          {lista.map((o) => (
            <Card key={o.aseguradora} className={cx("flex flex-wrap items-center gap-3 p-4", o.recomendada && "border-primary ring-1 ring-primary")}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-bold">{o.aseguradora}{o.recomendada && <Badge tone="primary" icon="star">Recomendada</Badge>}</div>
                <div className="text-xs text-muted">{o.plan} · {o.extra} · Franquicia {o.franquicia}</div>
              </div>
              <div className="text-right"><span className="text-xl font-extrabold tabular-nums">{fmtPesos(o.precio)}</span><span className="block text-xs text-faint">por mes</span></div>
              <Button
                size="sm"
                variant={o.recomendada ? "primary" : "secondary"}
                onClick={() => {
                  dispatch({ t: "cliente/elegirOferta", clienteId: cid, ramo, bien: detalle, aseguradora: o.aseguradora, plan: o.plan, precio: o.precio });
                  setListo(`Elegiste ${o.aseguradora} por ${fmtPesos(o.precio)} por mes. ${a} ya recibió tu elección y te escribe para terminar el alta.`);
                }}
              >
                La quiero
              </Button>
            </Card>
          ))}
          <button
            onClick={() => {
              dispatch({ t: "cliente/cotizar", clienteId: cid, ramo, bien: detalle });
              setListo(`Le avisamos a ${a}: te va a contactar para armarte una propuesta a medida.`);
            }}
            className="self-center text-sm font-semibold text-primary hover:underline"
          >
            Prefiero que me asesore {a}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Chat ---------- */

const RAPIDAS = ["¿Cuándo vence mi próxima cuota?", "Quiero adherirme al débito automático", "Necesito cambiar mi auto en la póliza"];

function Chat({ s, cid, movil }: VistaProps) {
  const { dispatch } = useDemo();
  const [texto, setTexto] = useState("");
  const fin = useRef<HTMLDivElement>(null);
  const msgs = s.mensajes.filter((m) => m.clienteId === cid);
  const a = asesor(s, cliente(s, cid).asesorId);
  useEffect(() => fin.current?.scrollIntoView({ block: "nearest" }), [msgs.length]);
  const enviar = (t: string) => {
    if (!t.trim()) return;
    dispatch({ t: "cliente/mensaje", clienteId: cid, texto: t.trim() });
    setTexto("");
  };
  return (
    <Card className={cx("mx-auto flex w-full max-w-[760px] flex-col overflow-hidden", movil ? "h-full min-h-[460px]" : "h-[560px]")}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Avatar nombre={a.nombre} />
        <div>
          <div className="font-bold">{a.nombre}</div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-on-ok"><span className="size-2 rounded-full bg-ok" /> Tu asesora · responde en el día</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-bg p-4">
        {msgs.length === 0 && <p className="m-auto max-w-xs text-center text-sm text-muted">Escribile a {a.nombre.split(" ")[0]} lo que necesites. Le llega al instante en su panel.</p>}
        {msgs.map((m) => {
          const mio = m.de === "cliente";
          return (
            <div key={m.id} className={cx("max-w-[82%] rounded-2xl px-3.5 py-2 text-sm shadow-sm", mio ? "self-end rounded-br-md bg-primary text-white" : "self-start rounded-bl-md bg-surface")}>
              {!mio && <div className="mb-0.5 text-[11px] font-bold text-primary">{m.de === "cobranzas" ? "Cobranzas" : a.nombre.split(" ")[0]}</div>}
              {m.texto}
              <div className={cx("mt-1 text-right text-[11px]", mio ? "text-white/70" : "text-faint")}>{fmtFecha(m.fecha)} · {m.hora}</div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>
      <div className="flex flex-col gap-2 border-t border-line p-3">
        <div className="flex flex-wrap gap-1.5">
          {RAPIDAS.map((r) => (
            <button key={r} onClick={() => enviar(r)} className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-2 hover:bg-bg">{r}</button>
          ))}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
          <input className={inputClass} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí tu mensaje" aria-label="Mensaje" />
          <Button type="submit" icon="send" aria-label="Enviar" />
        </form>
      </div>
    </Card>
  );
}
