"use client";

/** Gestión de contacto: la cola del día, ordenada por días de atraso, con el chat y las llamadas. */
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { morosos } from "./mora";
import { Avatar, Badge, Button, Card, Empty, Field, Icon, Loading, Modal, PageHeader, cx, inputClass } from "@/components/ui";
import { fmtFecha, fmtPesos } from "@/lib/format";
import { moraPendiente } from "@/lib/rules";
import { useDemo } from "@/lib/store";

const PLANTILLAS = [
  { icon: "waving_hand", label: "Recordatorio amable", texto: (n: string, d: string) => `Hola ${n}, ¿cómo estás? Te escribimos porque tenés ${d} pendientes en tu seguro. Podés pagarlo desde tu autogestión en un minuto.` },
  { icon: "calendar_month", label: "Ofrecer plan de pago", texto: (n: string) => `${n}, si te queda más cómodo, podemos armarte un plan de pago en cuotas para que no pierdas tu cobertura. ¿Te interesa?` },
  { icon: "warning", label: "Aviso de suspensión", texto: (n: string) => `${n}, tu póliza tiene más de 30 días de atraso y la aseguradora puede suspender la cobertura. Escribinos y lo resolvemos juntos.` },
];
const RESULTADOS = [
  { r: "Atendió" as const, icon: "call" },
  { r: "Promesa de pago" as const, icon: "handshake" },
  { r: "No atendió" as const, icon: "phone_missed" },
];

export function Contacto() {
  const { s, dispatch } = useDemo();
  const params = useSearchParams();
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [pagar, setPagar] = useState(false);
  if (!s) return <Loading />;

  const cola = morosos(s);
  const cur = cola.find((f) => f.id === params.get("cliente")) ?? cola[0];

  if (!cur)
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Gestión de contacto" subtitle="Cola del día ordenada por días de atraso" />
        <Card><Empty icon="sentiment_satisfied" title="No hay nadie en la cola">Todos los clientes están al día.</Empty></Card>
      </div>
    );

  const nombre = cur.c.nombre.split(" ")[0];
  const chat = s.mensajes.filter((m) => m.clienteId === cur.id && m.de !== "asesor");
  const llamadas = cur.cuotas.flatMap((q) => q.historial).filter((h) => h.texto.startsWith("Llamada") || h.texto.startsWith("Recordatorio")).reverse();
  const unicas = llamadas.filter((h, i) => llamadas.findIndex((x) => x.fecha === h.fecha && x.texto === h.texto) === i).slice(0, 5);
  const enviar = (t: string) => t.trim() && dispatch({ t: "mensaje/enviar", clienteId: cur.id, de: "cobranzas", texto: t.trim() });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Gestión de contacto" subtitle={`Cola del día ordenada por días de atraso · ${cola.length} clientes`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <Card className="flex h-fit flex-col gap-1 p-2">
          {cola.map((f) => (
            <button key={f.id} onClick={() => router.replace(`/cobranzas/contacto?cliente=${f.id}`)} className={cx("flex flex-col gap-0.5 rounded-xl p-2.5 text-left", f.id === cur.id ? "bg-primary-soft" : "hover:bg-bg")}>
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-bold">{f.c.nombre}</span>
                <Badge tone={f.tardia ? "danger" : "warn"}>{f.dias} d</Badge>
              </span>
              <span className="text-xs text-muted">{f.polizas[0]?.numero} · {fmtPesos(f.total)}</span>
            </button>
          ))}
        </Card>

        <Card className="flex min-h-[520px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar nombre={cur.c.nombre} />
            <div>
              <div className="font-bold">{cur.c.nombre}</div>
              <div className="text-xs text-muted">WhatsApp · {cur.c.telefono}</div>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#eef0f5] p-4">
            {chat.length === 0 && <p className="m-auto text-sm text-muted">Todavía no le escribimos. Usá una plantilla para empezar.</p>}
            {chat.map((m) => (
              <div key={m.id} className={cx("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm", m.de === "cobranzas" ? "self-end rounded-br-md bg-primary text-white" : "self-start rounded-bl-md bg-surface")}>
                {m.texto}
                <div className={cx("mt-1 text-right text-[11px]", m.de === "cobranzas" ? "text-white/70" : "text-faint")}>{fmtFecha(m.fecha)} · {m.hora}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-line p-3">
            <div className="flex flex-wrap gap-1.5">
              {PLANTILLAS.map((p) => (
                <button key={p.label} onClick={() => enviar(p.texto(nombre, `${cur.cuotas.length} ${cur.cuotas.length === 1 ? "cuota" : "cuotas"}`))} className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold hover:bg-bg">
                  <Icon name={p.icon} size={16} /> {p.label}
                </button>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); enviar(texto); setTexto(""); }}>
              <input className={inputClass} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí un mensaje" aria-label="Mensaje" />
              <Button type="submit" icon="send" aria-label="Enviar" />
            </form>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-1 p-5">
            <span className="text-xs font-semibold text-faint">Deuda total</span>
            <span className={cx("text-[28px] font-extrabold", cur.tardia ? "text-on-danger" : "text-on-warn")}>{fmtPesos(cur.total)}</span>
            <span className="text-sm text-muted">{cur.cuotas.length} {cur.cuotas.length === 1 ? "cuota" : "cuotas"} · {cur.dias} días de atraso</span>
            <span className="text-sm text-muted">{cur.polizas.map((p) => `${p.numero} · ${p.aseguradora}`).join(" / ")}</span>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" icon="payments" onClick={() => setPagar(true)}>Registrar pago</Button>
              {cur.pendientes.length > 0 && (
                <Button size="sm" variant="danger" onClick={() => cur.pendientes.forEach((q) => dispatch({ t: "cuota/mora", cuotaId: q.id, nivel: moraPendiente(q, s.hoy)! }))}>
                  Pasar a mora
                </Button>
              )}
            </div>
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <span className="text-sm font-bold">Registrar llamada</span>
            <div className="grid grid-cols-3 gap-1.5">
              {RESULTADOS.map((b) => (
                <button key={b.r} onClick={() => dispatch({ t: "cobranza/llamada", clienteId: cur.id, resultado: b.r })} className="flex flex-col items-center gap-1 rounded-xl border border-line p-2 text-center text-xs font-semibold hover:bg-bg">
                  <Icon name={b.icon} size={20} className="text-primary" /> {b.r}
                </button>
              ))}
            </div>
            {cur.promesa && <Badge tone="info" icon="handshake" className="self-start">Prometió pagar el {fmtFecha(cur.promesa)}</Badge>}
            <ol className="mt-1 flex flex-col gap-1.5">
              {unicas.map((h, i) => (
                <li key={i} className="flex justify-between gap-2 border-t border-line-soft pt-1.5 text-xs">
                  <span>{h.texto}</span>
                  <span className="shrink-0 text-faint">{fmtFecha(h.fecha)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
      {pagar && <PagoModal clienteId={cur.id} onClose={() => setPagar(false)} />}
    </div>
  );
}

function PagoModal({ clienteId, onClose }: { clienteId: string; onClose: () => void }) {
  const { s, dispatch } = useDemo();
  const [medio, setMedio] = useState("Transferencia");
  const cuotas = morosos(s!).find((f) => f.id === clienteId)?.cuotas ?? [];
  return (
    <Modal title="Registrar pago" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          cuotas.forEach((q) => dispatch({ t: "cuota/pagar", cuotaId: q.id, medio }));
          onClose();
        }}
      >
        <p className="text-sm text-muted">Se registran como pagas las {cuotas.length} cuotas vencidas ({fmtPesos(cuotas.reduce((t, q) => t + q.monto, 0))}).</p>
        <Field label="Medio de pago">
          <select className={inputClass} value={medio} onChange={(e) => setMedio(e.target.value)}>
            {["Transferencia", "Efectivo en el local", "Mercado Pago", "Tarjeta de crédito"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Button type="submit" icon="check">Confirmar pago</Button>
      </form>
    </Modal>
  );
}
