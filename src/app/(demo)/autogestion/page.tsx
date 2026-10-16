"use client";

/** Autogestión: entrar como un cliente de prueba o darse de alta. */
import { useState } from "react";
import { LogoMark } from "@/components/logo";
import { Avatar, Button, Card, Field, Icon, Loading, Modal, inputClass } from "@/components/ui";
import { useDemo } from "@/lib/store";
import { deudaDe } from "@/lib/rules";
import { RAMOS, type Estado, type Ramo } from "@/lib/types";
import { Portal } from "@/views/cliente/portal";

export default function AutogestionPage() {
  const { s } = useDemo();
  if (!s) return <Loading />;
  return s.clienteActual ? <Portal key={s.clienteActual} s={s} cid={s.clienteActual} /> : <Bienvenida s={s} />;
}

function Bienvenida({ s }: { s: Estado }) {
  const { dispatch } = useDemo();
  const [alta, setAlta] = useState(false);
  // Primero los casos más interesantes para probar: con plan de pago o con deuda
  const peso = (id: string) => (id === "c1" ? 0 : s.planes.some((p) => p.clienteId === id) ? 1 : deudaDe(s, id).cuotas.length ? 2 : 3);
  const conPolizas = s.clientes
    .filter((c) => s.polizas.some((p) => p.clienteId === c.id))
    .sort((a, b) => peso(a.id) - peso(b.id))
    .slice(0, 7);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 py-2">
      <div className="flex flex-col gap-2">
        <LogoMark size={40} />
        <h1 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Tu seguro, a mano</h1>
        <p className="text-[15px] text-muted">Mirá tus pólizas, pagá tus cuotas o pedí ayuda cuando la necesites, sin tener que llamar.</p>
      </div>
      <Card className="flex flex-col gap-3 p-5">
        <span className="font-bold">Entrar como un cliente de prueba</span>
        <div className="flex flex-col gap-1.5">
          {conPolizas.map((c) => {
            const d = deudaDe(s, c.id);
            return (
              <button key={c.id} onClick={() => dispatch({ t: "cliente/elegir", id: c.id })} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2 text-left hover:bg-bg">
                <Avatar nombre={c.nombre} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.nombre}</span>
                  <span className="block text-xs text-muted">
                    {s.polizas.filter((p) => p.clienteId === c.id).length} pólizas · {s.planes.some((p) => p.clienteId === c.id) ? <span className="font-semibold text-on-info">con plan de pago</span> : d.cuotas.length ? <span className="font-semibold text-on-danger">{d.dias} días de atraso</span> : "al día"}
                  </span>
                </span>
                <Icon name="chevron_right" className="text-faint" />
              </button>
            );
          })}
        </div>
      </Card>
      <Card className="flex flex-col items-start gap-3 p-5">
        <span className="font-bold">¿Todavía no sos cliente?</span>
        <p className="text-sm text-muted">Date de alta en un minuto. Te asignamos un asesor que te acompaña desde el primer día, y tu pedido le llega al instante.</p>
        <Button icon="person_add" onClick={() => setAlta(true)}>Darme de alta</Button>
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
    if (f.nombre.trim().split(/\s+/).length < 2) return setError("Escribí tu nombre y apellido.");
    if (f.telefono.replace(/\D/g, "").length < 8) return setError("Revisá el celular: necesitamos al menos 8 números.");
    dispatch({ t: "cliente/alta", ...f, nombre: f.nombre.trim(), bien: f.bien.trim() || `Mi ${f.ramo.toLowerCase()}` });
    onClose();
  };
  return (
    <Modal title="Darme de alta" onClose={onClose}>
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Field label="Nombre y apellido">
          <input className={inputClass} value={f.nombre} onChange={set("nombre")} autoComplete="name" placeholder="Lucas Martínez" />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="DNI"><input className={inputClass} value={f.dni} onChange={set("dni")} inputMode="numeric" placeholder="35.123.456" /></Field>
          <Field label="Celular"><input className={inputClass} value={f.telefono} onChange={set("telefono")} inputMode="tel" autoComplete="tel" placeholder="221 555-1234" /></Field>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="Email"><input className={inputClass} value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="lucas@ejemplo.com" /></Field>
          <Field label="Ciudad"><input className={inputClass} value={f.ciudad} onChange={set("ciudad")} /></Field>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field label="¿Qué querés asegurar?">
            <select className={inputClass} value={f.ramo} onChange={set("ramo")}>
              {RAMOS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Contanos un poco más" hint="Opcional">
            <input className={inputClass} value={f.bien} onChange={set("bien")} placeholder="Fiat Cronos 2022" />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-on-danger">{error}</p>}
        <p className="text-xs text-muted">Demo: no se guarda ningún dato. Al recargar, todo vuelve a empezar.</p>
        <Button type="submit">Crear mi cuenta</Button>
      </form>
    </Modal>
  );
}
