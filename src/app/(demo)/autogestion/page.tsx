"use client";

/** Autogestión: lo que ve el cliente desde su celular. */
import { useState } from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconBrandWhatsapp,
  IconCheck,
  IconCreditCard,
  IconFileCertificate,
  IconPlus,
  IconShieldCheck,
  IconUserPlus,
} from "@tabler/icons-react";
import { ICONO_RAMO } from "@/components/ramo";
import { Avatar, Badge, Button, Card, Field, Loading, Modal, cx, inputClass } from "@/components/ui";
import { addDays, fmtFecha, fmtFechaLarga, fmtPesos, relativo } from "@/lib/format";
import { asesor, estadoCuota, estadoPoliza } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import { PASOS, RAMOS, type Cuota, type Estado, type Poliza, type Ramo } from "@/lib/types";

export default function AutogestionPage() {
  const { s } = useDemo();
  if (!s) return <Loading />;
  return s.clienteActual ? <Inicio s={s} clienteId={s.clienteActual} /> : <Bienvenida s={s} />;
}

/* ---------- Entrada: elegir cliente de prueba o darse de alta ---------- */

function Bienvenida({ s }: { s: Estado }) {
  const { dispatch } = useDemo();
  const [alta, setAlta] = useState(false);
  const conPolizas = s.clientes.filter((c) => s.polizas.some((p) => p.clienteId === c.id));
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-rol-cliente">Autogestión</span>
        <h1 className="font-display text-3xl font-bold tracking-tight">Tu seguro, en tu mano</h1>
        <p className="text-muted">Mirá tus pólizas, pagá tus cuotas o pedí ayuda cuando la necesites, sin tener que llamar.</p>
      </div>
      <Card className="flex flex-col gap-3 p-5">
        <span className="font-semibold">Entrar como un cliente de prueba</span>
        <div className="flex flex-col gap-2">
          {conPolizas.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => dispatch({ t: "cliente/elegir", id: c.id })}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 text-left hover:bg-surface-2"
            >
              <Avatar nombre={c.nombre} size={32} />
              <span className="flex-1 font-semibold">{c.nombre}</span>
              <span className="text-xs text-muted">{s.polizas.filter((p) => p.clienteId === c.id).length} pólizas</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col items-start gap-3 p-5">
        <span className="font-semibold">¿Todavía no sos cliente?</span>
        <p className="text-sm text-muted">Date de alta en un minuto: te asignamos un asesor que te acompaña desde el primer día.</p>
        <Button onClick={() => setAlta(true)}>
          <IconUserPlus size={18} aria-hidden="true" /> Darme de alta
        </Button>
      </Card>
      {alta && <AltaModal onClose={() => setAlta(false)} />}
    </div>
  );
}

function AltaModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useDemo();
  const [f, setF] = useState({ nombre: "", dni: "", telefono: "", email: "", ciudad: "La Plata", ramo: "Auto" as Ramo, bien: "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError("");
    setF({ ...f, [k]: e.target.value });
  };
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.nombre.trim().split(" ").length < 2) return setError("Escribí tu nombre y apellido.");
    if (f.telefono.replace(/\D/g, "").length < 8) return setError("Revisá el teléfono: necesitamos al menos 8 números.");
    dispatch({ t: "cliente/alta", ...f, nombre: f.nombre.trim(), bien: f.bien.trim() || `Mi ${f.ramo.toLowerCase()}` });
    onClose();
  };
  return (
    <Modal title="Darme de alta" onClose={onClose}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Field label="Nombre y apellido">
          <input className={inputClass} value={f.nombre} onChange={set("nombre")} autoComplete="name" placeholder="Lucas Martínez" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="DNI">
            <input className={inputClass} value={f.dni} onChange={set("dni")} inputMode="numeric" placeholder="35.123.456" />
          </Field>
          <Field label="Celular">
            <input className={inputClass} value={f.telefono} onChange={set("telefono")} inputMode="tel" autoComplete="tel" placeholder="221 555-1234" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input className={inputClass} value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="lucas@ejemplo.com" />
          </Field>
          <Field label="Ciudad">
            <input className={inputClass} value={f.ciudad} onChange={set("ciudad")} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="¿Qué querés asegurar?">
            <select className={inputClass} value={f.ramo} onChange={set("ramo")}>
              {RAMOS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Contanos un poco más" hint="Opcional">
            <input className={inputClass} value={f.bien} onChange={set("bien")} placeholder="Fiat Cronos 2022" />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
        <p className="text-xs text-muted">Demo: no se guarda ningún dato. Al recargar, todo vuelve a empezar.</p>
        <Button type="submit">Crear mi cuenta</Button>
      </form>
    </Modal>
  );
}

/* ---------- Inicio del cliente ---------- */

function Inicio({ s, clienteId }: { s: Estado; clienteId: string }) {
  const { dispatch } = useDemo();
  const c = s.clientes.find((x) => x.id === clienteId)!;
  const a = asesor(s, c.asesorId);
  const polizas = s.polizas.filter((p) => p.clienteId === c.id);
  const cuotas = s.cuotas.filter((q) => q.clienteId === c.id && !q.pagada).sort((x, y) => x.vence.localeCompare(y.vence));
  const vencidas = cuotas.filter((q) => q.vence < s.hoy);
  const leads = s.leads.filter((l) => l.clienteId === c.id && !["Perdida"].includes(l.etapa) && !(l.etapa === "Ganada" && l.proxAccion === "Póliza emitida"));
  const gestiones = s.gestiones.filter((g) => g.clienteId === c.id && g.paso < PASOS[g.tipo].length - 1);
  const avisos = s.eventos.filter((e) => e.para === "cliente" && e.clienteId === c.id).slice(-3).reverse();

  const [modal, setModal] = useState<null | { t: "pagar"; cuota: Cuota } | { t: "siniestro"; poliza?: Poliza } | { t: "cotizar" } | { t: "certificado"; poliza: Poliza } | { t: "mensaje" }>(null);
  const cerrar = () => setModal(null);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-rol-cliente">Autogestión</span>
          <h1 className="font-display text-3xl font-bold tracking-tight">Hola, {c.nombre.split(" ")[0]}</h1>
        </div>
        <button onClick={() => dispatch({ t: "cliente/elegir", id: "" })} className="text-sm font-semibold text-muted underline-offset-4 hover:underline">
          Cambiar de cliente
        </button>
      </div>

      {vencidas.length > 0 && (
        <div role="alert" className={cx("flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center", vencidas.some((q) => q.mora === "tardia" || estadoCuota(q, s.hoy) === "Mora tardía") ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn")}>
          <IconAlertTriangle size={22} aria-hidden="true" className="shrink-0" />
          <div className="flex-1 text-sm">
            <strong className="block text-base">{vencidas.length === 1 ? "Tenés una cuota vencida" : `Tenés ${vencidas.length} cuotas vencidas`}</strong>
            Pagala para seguir cubierto. Si estás pasando un momento difícil, escribile a {a.nombre.split(" ")[0]}: te ayuda a encontrar una salida.
          </div>
          <Button size="sm" variant="secondary" onClick={() => setModal({ t: "pagar", cuota: vencidas[0] })}>
            Pagar ahora
          </Button>
        </div>
      )}

      {avisos.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <span className="flex items-center gap-2 text-sm font-semibold"><IconBell size={16} aria-hidden="true" /> Novedades</span>
          {avisos.map((e) => (
            <p key={e.id} className="text-sm text-muted">{e.texto}</p>
          ))}
        </Card>
      )}

      <Card className="flex items-center gap-3 p-4">
        <Avatar nombre={a.nombre} size={44} />
        <div className="flex-1">
          <span className="block text-xs text-muted">Tu asesora</span>
          <span className="font-semibold">{a.nombre}</span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setModal({ t: "mensaje" })}>
          <IconBrandWhatsapp size={17} aria-hidden="true" /> Escribirle
        </Button>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="seguros">
        <div className="flex items-center justify-between">
          <h2 id="seguros" className="font-display text-xl font-bold">Mis seguros</h2>
          <Button size="sm" variant="ghost" onClick={() => setModal({ t: "cotizar" })}>
            <IconPlus size={16} aria-hidden="true" /> Cotizar otro
          </Button>
        </div>
        {polizas.length === 0 && (
          <Card className="flex flex-col items-start gap-3 p-5">
            <p className="text-sm text-muted">Todavía no tenés pólizas activas. {leads.length > 0 ? "Tu asesora ya está preparando tu cotización." : "Pedí tu primera cotización y te contactamos hoy."}</p>
            {leads.length === 0 && <Button size="sm" onClick={() => setModal({ t: "cotizar" })}>Pedir una cotización</Button>}
          </Card>
        )}
        {polizas.map((p) => {
          const Icono = ICONO_RAMO[p.ramo];
          const estado = estadoPoliza(p, s.hoy);
          return (
            <Card key={p.id} className="flex flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-flow-soft text-on-flow-soft">
                  <Icono size={22} aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{p.ramo}</span>
                  <span className="truncate text-sm text-muted">{p.bien}</span>
                  <span className="text-xs text-muted">{p.aseguradora} · Póliza {p.numero}</span>
                </div>
                <Badge tone={estado === "Vigente" ? "ok" : estado === "Por renovar" ? "warn" : "danger"}>{estado}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-sm">
                <span className="text-muted">
                  {fmtPesos(p.prima)}/mes · vence el {fmtFecha(p.hasta)}
                </span>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => setModal({ t: "certificado", poliza: p })}>
                    <IconFileCertificate size={16} aria-hidden="true" /> Certificado
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setModal({ t: "siniestro", poliza: p })}>
                    Denunciar siniestro
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      {(leads.length > 0 || gestiones.length > 0) && (
        <section className="flex flex-col gap-3" aria-labelledby="curso">
          <h2 id="curso" className="font-display text-xl font-bold">En curso</h2>
          {leads.map((l) => (
            <Card key={l.id} className="flex flex-col gap-1 p-4">
              <span className="font-semibold">Cotización de {l.ramo.toLowerCase()}</span>
              <span className="text-sm text-muted">
                {l.etapa === "Ganada" ? "¡Aceptaste la propuesta! Administración está emitiendo tu póliza." : `${a.nombre.split(" ")[0]} la está preparando. Estado: ${l.etapa.toLowerCase()}.`}
              </span>
            </Card>
          ))}
          {gestiones.map((g) => {
            const pasos = PASOS[g.tipo];
            return (
              <Card key={g.id} className="flex flex-col gap-3 p-4">
                <span className="font-semibold">{g.tipo} · {g.ramo}</span>
                <ol className="flex gap-1" aria-label={`Paso ${g.paso + 1} de ${pasos.length}`}>
                  {pasos.map((p, i) => (
                    <li key={p} className="flex flex-1 flex-col gap-1">
                      <span className={cx("h-1.5 rounded-full", i <= g.paso ? "bg-flow" : "bg-surface-2")} />
                      <span className={cx("text-[11px] leading-tight", i === g.paso ? "font-semibold text-ink" : "text-muted")}>{p}</span>
                    </li>
                  ))}
                </ol>
              </Card>
            );
          })}
        </section>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="pagos">
        <h2 id="pagos" className="font-display text-xl font-bold">Mis cuotas</h2>
        {cuotas.length === 0 && <Card className="p-4 text-sm text-muted">Estás al día. ¡Gracias!</Card>}
        {cuotas.slice(0, 4).map((q) => {
          const p = s.polizas.find((x) => x.id === q.polizaId)!;
          const e = estadoCuota(q, s.hoy);
          return (
            <Card key={q.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="flex flex-1 flex-col">
                <span className="font-semibold">{p.ramo} · cuota {q.nro}</span>
                <span className="text-sm text-muted">
                  {fmtPesos(q.monto)} · {e === "Por vencer" || e === "Vence hoy" ? `vence ${relativo(q.vence, s.hoy)}` : `venció el ${fmtFecha(q.vence)}`}
                </span>
              </div>
              <Badge tone={e === "Mora tardía" ? "danger" : e === "Mora temprana" ? "warn" : "neutral"}>{e}</Badge>
              <Button size="sm" onClick={() => setModal({ t: "pagar", cuota: q })}>
                <IconCreditCard size={16} aria-hidden="true" /> Pagar
              </Button>
            </Card>
          );
        })}
      </section>

      {modal?.t === "pagar" && <PagarModal s={s} cuota={modal.cuota} onClose={cerrar} />}
      {modal?.t === "siniestro" && <SiniestroModal s={s} clienteId={c.id} poliza={modal.poliza} onClose={cerrar} />}
      {modal?.t === "cotizar" && <CotizarModal clienteId={c.id} asesora={a.nombre} onClose={cerrar} />}
      {modal?.t === "certificado" && <CertificadoModal s={s} poliza={modal.poliza} onClose={cerrar} />}
      {modal?.t === "mensaje" && <MensajeModal clienteId={c.id} asesora={a.nombre} onClose={cerrar} />}
    </div>
  );
}

const MEDIOS = ["Mercado Pago", "Tarjeta de crédito", "Transferencia", "Débito automático"];

function PagarModal({ s, cuota, onClose }: { s: Estado; cuota: Cuota; onClose: () => void }) {
  const { dispatch } = useDemo();
  const [medio, setMedio] = useState(MEDIOS[0]);
  const [listo, setListo] = useState(false);
  const p = s.polizas.find((x) => x.id === cuota.polizaId)!;
  if (listo)
    return (
      <Modal title="¡Pago recibido!" onClose={onClose}>
        <div className="flex flex-col items-start gap-4">
          <span className="grid size-12 place-items-center rounded-full bg-ok-soft text-ok"><IconCheck size={26} aria-hidden="true" /></span>
          <p className="text-muted">Pagaste la cuota {cuota.nro} de {p.ramo.toLowerCase()} con {medio}. Cobranzas ya lo ve como pagado.</p>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </Modal>
    );
  return (
    <Modal title={`Pagar cuota ${cuota.nro}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-surface-2 p-4">
          <span className="block text-sm text-muted">{p.ramo} · {p.bien}</span>
          <span className="font-display text-3xl font-bold">{fmtPesos(cuota.monto)}</span>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">¿Cómo querés pagar?</legend>
          {MEDIOS.map((m) => (
            <label key={m} className={cx("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3.5", medio === m ? "border-primary bg-flow-soft" : "border-line")}>
              <input type="radio" name="medio" checked={medio === m} onChange={() => setMedio(m)} className="accent-[var(--primary)]" />
              {m}
            </label>
          ))}
        </fieldset>
        <Button
          onClick={() => {
            dispatch({ t: "cliente/pagar", cuotaId: cuota.id, medio });
            setListo(true);
          }}
        >
          Pagar {fmtPesos(cuota.monto)}
        </Button>
        <p className="text-center text-xs text-muted">Demo: no se cobra nada de verdad.</p>
      </div>
    </Modal>
  );
}

const QUE_PASO: Record<Ramo, string[]> = {
  Auto: ["Choque", "Robo", "Granizo", "Rotura de cristales"],
  Hogar: ["Daño por agua", "Robo", "Incendio", "Rotura de electrodomésticos"],
  Vida: ["Consulta sobre beneficiarios", "Fallecimiento de un asegurado"],
  Comercio: ["Robo en el local", "Incendio", "Daño por agua", "Rotura de vidriera"],
  "Accidentes personales": ["Accidente con lesiones", "Internación"],
};

function SiniestroModal({ s, clienteId, poliza, onClose }: { s: Estado; clienteId: string; poliza?: Poliza; onClose: () => void }) {
  const { dispatch } = useDemo();
  const polizas = s.polizas.filter((p) => p.clienteId === clienteId);
  const [paso, setPaso] = useState(0);
  const [polizaId, setPolizaId] = useState(poliza?.id ?? polizas[0]?.id);
  const pol = polizas.find((p) => p.id === polizaId)!;
  const [que, setQue] = useState("");
  const [cuando, setCuando] = useState(s.hoy);
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");
  const a = asesor(s, s.clientes.find((c) => c.id === clienteId)!.asesorId);

  if (paso === 3)
    return (
      <Modal title="Recibimos tu denuncia" onClose={onClose}>
        <div className="flex flex-col items-start gap-4">
          <span className="grid size-12 place-items-center rounded-full bg-ok-soft text-ok"><IconShieldCheck size={26} aria-hidden="true" /></span>
          <p className="text-muted">
            Administración ya tiene tu caso y {a.nombre.split(" ")[0]} te va a llamar hoy para acompañarte. Podés seguir cada paso desde &quot;En curso&quot;.
          </p>
          <Button onClick={onClose}>Volver al inicio</Button>
        </div>
      </Modal>
    );

  return (
    <Modal title="Denunciar un siniestro" onClose={onClose}>
      <ol className="mb-5 flex gap-1" aria-label={`Paso ${paso + 1} de 3`}>
        {["Qué pasó", "Cuándo y cómo", "Confirmar"].map((t, i) => (
          <li key={t} className="flex flex-1 flex-col gap-1">
            <span className={cx("h-1.5 rounded-full", i <= paso ? "bg-flow" : "bg-surface-2")} />
            <span className={cx("text-xs", i === paso ? "font-semibold" : "text-muted")}>{t}</span>
          </li>
        ))}
      </ol>
      {paso === 0 && (
        <div className="flex flex-col gap-4">
          <Field label="¿Con qué póliza?">
            <select className={inputClass} value={polizaId} onChange={(e) => { setPolizaId(e.target.value); setQue(""); }}>
              {polizas.map((p) => (
                <option key={p.id} value={p.id}>{p.ramo} · {p.bien}</option>
              ))}
            </select>
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">¿Qué pasó?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUE_PASO[pol.ramo].map((q) => (
                <button key={q} type="button" onClick={() => { setQue(q); setError(""); }} aria-pressed={que === q} className={cx("min-h-12 rounded-xl border px-3.5 text-left font-semibold", que === q ? "border-primary bg-flow-soft" : "border-line hover:bg-surface-2")}>
                  {q}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <Button onClick={() => (que ? setPaso(1) : setError("Elegí qué pasó para seguir."))}>Seguir</Button>
        </div>
      )}
      {paso === 1 && (
        <div className="flex flex-col gap-4">
          <Field label="¿Cuándo pasó?">
            <input type="date" className={inputClass} value={cuando} max={s.hoy} min={addDays(s.hoy, -60)} onChange={(e) => setCuando(e.target.value)} />
          </Field>
          <Field label="Contanos con tus palabras" hint="Lo que recuerdes: dónde fue, si hubo otras personas involucradas.">
            <textarea className={cx(inputClass, "min-h-28 py-3")} value={descripcion} onChange={(e) => { setDescripcion(e.target.value); setError(""); }} />
          </Field>
          {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(0)}>Volver</Button>
            <Button className="flex-1" onClick={() => (descripcion.trim().length >= 10 ? setPaso(2) : setError("Contanos un poco más (al menos 10 caracteres)."))}>Seguir</Button>
          </div>
        </div>
      )}
      {paso === 2 && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
            <dt className="text-muted">Póliza</dt><dd className="font-semibold">{pol.ramo} · {pol.bien}</dd>
            <dt className="text-muted">Qué pasó</dt><dd className="font-semibold">{que}</dd>
            <dt className="text-muted">Cuándo</dt><dd className="font-semibold">{fmtFechaLarga(cuando)}</dd>
            <dt className="text-muted">Relato</dt><dd>{descripcion}</dd>
          </dl>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPaso(1)}>Volver</Button>
            <Button
              className="flex-1"
              onClick={() => {
                dispatch({ t: "cliente/siniestro", polizaId: pol.id, que, cuando: fmtFechaLarga(cuando), descripcion: descripcion.trim() });
                setPaso(3);
              }}
            >
              Enviar denuncia
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function CotizarModal({ clienteId, asesora, onClose }: { clienteId: string; asesora: string; onClose: () => void }) {
  const { dispatch } = useDemo();
  const [ramo, setRamo] = useState<Ramo>("Hogar");
  const [bien, setBien] = useState("");
  const [listo, setListo] = useState(false);
  if (listo)
    return (
      <Modal title="¡Listo!" onClose={onClose}>
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">{asesora.split(" ")[0]} ya tiene tu pedido y te va a contactar hoy con una propuesta.</p>
          <Button onClick={onClose}>Volver al inicio</Button>
        </div>
      </Modal>
    );
  return (
    <Modal title="Pedir una cotización" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ t: "cliente/cotizar", clienteId, ramo, bien: bien.trim() || `${ramo}` });
          setListo(true);
        }}
        className="flex flex-col gap-4"
      >
        <Field label="¿Qué querés asegurar?">
          <select className={inputClass} value={ramo} onChange={(e) => setRamo(e.target.value as Ramo)}>
            {RAMOS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Contanos un poco más" hint="Opcional. Por ejemplo: departamento de 2 ambientes en La Plata.">
          <input className={inputClass} value={bien} onChange={(e) => setBien(e.target.value)} />
        </Field>
        <Button type="submit">Pedir cotización</Button>
      </form>
    </Modal>
  );
}

function CertificadoModal({ s, poliza, onClose }: { s: Estado; poliza: Poliza; onClose: () => void }) {
  const c = s.clientes.find((x) => x.id === poliza.clienteId)!;
  return (
    <Modal title="Certificado de cobertura" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border-2 border-dashed border-line p-5 text-sm">
          <span className="font-display text-lg font-bold">{poliza.aseguradora}</span>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted">Asegurado</dt><dd className="font-semibold">{c.nombre}</dd>
            <dt className="text-muted">Póliza</dt><dd className="font-semibold">{poliza.numero}</dd>
            <dt className="text-muted">Riesgo</dt><dd className="font-semibold">{poliza.ramo} · {poliza.bien}</dd>
            <dt className="text-muted">Suma asegurada</dt><dd className="font-semibold">{fmtPesos(poliza.suma)}</dd>
            <dt className="text-muted">Vigencia</dt><dd className="font-semibold">{fmtFecha(poliza.desde)} al {fmtFecha(poliza.hasta)}</dd>
          </dl>
        </div>
        <p className="text-xs text-muted">Demo: en la versión real se descarga el PDF que emite la aseguradora.</p>
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </Modal>
  );
}

function MensajeModal({ clienteId, asesora, onClose }: { clienteId: string; asesora: string; onClose: () => void }) {
  const { dispatch } = useDemo();
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const nombre = asesora.split(" ")[0];
  if (enviado)
    return (
      <Modal title="Mensaje enviado" onClose={onClose}>
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">{nombre} lo recibió en su panel y te va a responder por WhatsApp.</p>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </Modal>
    );
  return (
    <Modal title={`Escribirle a ${nombre}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          dispatch({ t: "cliente/mensaje", clienteId, texto: texto.trim() });
          setEnviado(true);
        }}
        className="flex flex-col gap-4"
      >
        <Field label="Tu mensaje">
          <textarea className={cx(inputClass, "min-h-28 py-3")} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Hola, quería consultarte…" />
        </Field>
        <Button type="submit" disabled={!texto.trim()}>
          <IconBrandWhatsapp size={18} aria-hidden="true" /> Enviar
        </Button>
      </form>
    </Modal>
  );
}
