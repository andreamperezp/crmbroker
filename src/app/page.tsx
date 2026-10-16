"use client";

/** Ingreso a la demo: se elige con qué perfil recorrerla. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { Icon, cx, inputClass } from "@/components/ui";
import { ROLES } from "@/lib/roles";
import { ASEGURADORAS } from "@/lib/seed";
import type { Rol } from "@/lib/types";

const EMAILS: Record<Rol, string> = {
  asesor: "martina@brokerflow.demo",
  admin: "julian@brokerflow.demo",
  cobranzas: "valeria@brokerflow.demo",
  cliente: "lucia.fernandez@ejemplo.com",
};

const FLUJO = [
  ["person", "El cliente pide una cotización o se da de alta"],
  ["support_agent", "El asesor la gana y la pasa a emisión"],
  ["assignment", "Administración emite la póliza"],
  ["payments", "Cobranzas recibe las cuotas y acompaña la mora"],
];

export default function Ingreso() {
  const router = useRouter();
  const [rol, setRol] = useState<Rol>("asesor");
  const elegido = ROLES.find((r) => r.rol === rol)!;

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-2">
      <section className="flex flex-col justify-between gap-12 bg-ink px-6 py-10 text-white sm:px-14 sm:py-12">
        <Logo size={34} onDark />
        <div className="max-w-[520px]">
          <span className="text-xs font-bold tracking-[0.1em] text-primary-light uppercase">CRM para brokers de seguros</span>
          <h1 className="mt-4 mb-5 text-[40px] leading-[1.08] font-extrabold tracking-[-0.02em] text-pretty sm:text-[46px]">Cada cliente acompañado. Cada póliza al día.</h1>
          <p className="text-[17px] leading-relaxed text-[#c9cdea] text-pretty">
            Ventas, gestión administrativa, cobranzas y autogestión del asegurado en un mismo flujo de trabajo.
          </p>
          <ol className="mt-8 flex flex-col gap-3">
            {FLUJO.map(([icon, texto], i) => (
              <li key={texto} className="flex items-center gap-3 text-[15px] text-[#dfe2f5]">
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-white/10 text-primary-light">
                  <Icon name={icon} size={18} fill />
                </span>
                <span>
                  <span className="mr-1.5 text-primary-light">{i + 1}.</span>
                  {texto}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-[13px] leading-relaxed text-[#8f96c4]">
          Demo con datos ficticios · Aseguradoras de ejemplo: {ASEGURADORAS.join(" · ")}
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-8">
        <form
          className="flex w-full max-w-[460px] flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(elegido.href);
          }}
        >
          <div>
            <h2 className="m-0 text-[28px] font-bold tracking-[-0.01em]">Ingresá a la demo</h2>
            <p className="mt-1.5 text-[15px] text-muted">Elegí el perfil con el que querés recorrerla. Después podés cambiar en cualquier momento.</p>
          </div>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2">
            Email
            <input className={inputClass} value={EMAILS[rol]} readOnly aria-readonly="true" />
          </label>
          <fieldset className="grid grid-cols-2 gap-2.5">
            <legend className="sr-only">Perfil</legend>
            {ROLES.map((r) => {
              const on = r.rol === rol;
              return (
                <button
                  type="button"
                  key={r.rol}
                  onClick={() => setRol(r.rol)}
                  aria-pressed={on}
                  className={cx("flex flex-col items-start gap-2 rounded-xl border-[1.5px] p-3.5 text-left transition-colors", on ? "border-primary bg-primary-soft" : "border-line bg-surface hover:bg-bg")}
                >
                  <Icon name={r.icon} size={22} fill className="text-primary" />
                  <span className="text-sm font-bold">{r.nombre}</span>
                  <span className="text-xs leading-snug text-muted">{r.desc}</span>
                </button>
              );
            })}
          </fieldset>
          <button type="submit" className="h-12 rounded-xl bg-primary text-[15px] font-bold text-white hover:bg-primary-hover">
            Ingresar como {elegido.nombre.toLowerCase()}
          </button>
          <p className="text-center text-[13px] text-muted">No hace falta contraseña: es una demo y nada se guarda.</p>
        </form>
      </section>
    </div>
  );
}
