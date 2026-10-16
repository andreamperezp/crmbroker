"use client";

/** Documentación: el archivo digital de clientes y pólizas. */
import { useState } from "react";
import { Button, Card, Chip, Field, Icon, IconTile, Loading, Modal, PageHeader, inputClass } from "@/components/ui";
import { fmtFecha } from "@/lib/format";
import { cliente } from "@/lib/rules";
import { useDemo } from "@/lib/store";
import type { Documento } from "@/lib/types";

const TIPOS: Documento["tipo"][] = ["Póliza", "Certificado", "Cédula", "Denuncia", "Fotos"];
const ICONO: Record<Documento["tipo"], string> = { Póliza: "description", Certificado: "verified_user", Cédula: "badge", Denuncia: "report", Fotos: "photo_library", DNI: "id_card", Factura: "receipt_long" };

export function Documentacion() {
  const { s } = useDemo();
  const [tipo, setTipo] = useState<Documento["tipo"] | "Todos">("Todos");
  const [subir, setSubir] = useState(false);
  const [aviso, setAviso] = useState("");
  if (!s) return <Loading />;

  const docs = [...s.documentos].sort((a, b) => b.fecha.localeCompare(a.fecha)).filter((d) => tipo === "Todos" || d.tipo === tipo);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Documentación" subtitle={`Archivo digital de clientes y pólizas · ${s.documentos.length} documentos`} />
      <div className="flex flex-wrap gap-2">
        <Chip active={tipo === "Todos"} onClick={() => setTipo("Todos")}>Todos</Chip>
        {TIPOS.map((t) => (
          <Chip key={t} active={tipo === t} onClick={() => setTipo(t)} count={s.documentos.filter((d) => d.tipo === t).length}>{t}</Chip>
        ))}
      </div>
      <button onClick={() => setSubir(true)} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input bg-surface p-6 text-sm font-semibold text-muted hover:border-primary hover:text-primary">
        <Icon name="upload_file" size={22} /> Subir archivos · PDF, JPG o PNG
      </button>
      {aviso && <p role="status" className="rounded-xl bg-ok-soft p-3 text-sm font-semibold text-on-ok">{aviso}</p>}
      <Card className="divide-y divide-line-soft">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center gap-3 p-3.5">
            <IconTile name={ICONO[d.tipo]} tone={d.tipo === "Denuncia" ? "info" : "primary"} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{d.nombre}</div>
              <div className="text-xs text-muted">{cliente(s, d.clienteId).nombre} · {d.tipo} · {fmtFecha(d.fecha)}</div>
            </div>
            <button onClick={() => setAviso(`Descargaste "${d.nombre}" (en la demo no se genera el archivo).`)} aria-label={`Descargar ${d.nombre}`} className="grid size-9 place-items-center rounded-[9px] text-muted hover:bg-segment hover:text-ink">
              <Icon name="download" size={20} />
            </button>
          </div>
        ))}
      </Card>
      {subir && <Subir onClose={() => setSubir(false)} onDone={(n) => setAviso(`Subiste "${n}".`)} />}
    </div>
  );
}

function Subir({ onClose, onDone }: { onClose: () => void; onDone: (nombre: string) => void }) {
  const { s, dispatch } = useDemo();
  const [clienteId, setClienteId] = useState(s!.clientes[0].id);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal title="Subir documentación" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (nombre.trim().length < 3) return setError("Poné un nombre que se entienda, por ejemplo: Presupuesto del taller.");
          dispatch({ t: "doc/subir", clienteId, nombre: nombre.trim() });
          onDone(nombre.trim());
          onClose();
        }}
      >
        <Field label="Cliente">
          <select className={inputClass} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {s!.clientes.filter((c) => s!.polizas.some((p) => p.clienteId === c.id)).map((c) => <option key={c.id} value={c.id}>{cliente(s!, c.id).nombre}</option>)}
          </select>
        </Field>
        <Field label="Nombre del archivo">
          <input className={inputClass} value={nombre} onChange={(e) => { setNombre(e.target.value); setError(""); }} placeholder="Presupuesto del taller" />
        </Field>
        {error && <p role="alert" className="text-sm font-semibold text-on-danger">{error}</p>}
        <p className="text-xs text-muted">Demo: no se sube ningún archivo real.</p>
        <Button type="submit" icon="upload">Subir</Button>
      </form>
    </Modal>
  );
}
