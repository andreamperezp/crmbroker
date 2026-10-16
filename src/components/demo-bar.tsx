"use client";

/**
 * Barra de la demo: cambia de perfil en un toque, reinicia los datos y avisa
 * cuando una acción le llega a otro perfil (así se ve cómo se conecta todo).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconRefresh, IconX } from "@tabler/icons-react";
import { Logo } from "@/components/logo";
import { cx } from "@/components/ui";
import { ROLES, infoRol, rolDe } from "@/lib/roles";
import { useDemo } from "@/lib/store";
import type { Evento, Rol } from "@/lib/types";

export function DemoBar() {
  const { s, dispatch } = useDemo();
  const pathname = usePathname();
  const actual = rolDe(pathname);
  const eventos = s?.eventos ?? [];

  // Cuántos avisos vio cada perfil: lo nuevo se cuenta en la pestaña
  const [vistos, setVistos] = useState<Partial<Record<Rol, number>>>({});
  useEffect(() => {
    if (actual) setVistos((v) => ({ ...v, [actual.rol]: eventos.filter((e) => e.para === actual.rol).length }));
  }, [actual, eventos]);

  // Aviso flotante del último evento
  const [toast, setToast] = useState<Evento | null>(null);
  const ultimo = useRef(0);
  useEffect(() => {
    if (eventos.length > ultimo.current) {
      setToast(eventos[eventos.length - 1]);
      const t = setTimeout(() => setToast(null), 7000);
      ultimo.current = eventos.length;
      return () => clearTimeout(t);
    }
    ultimo.current = eventos.length;
  }, [eventos]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link href="/" aria-label="Brokerflow, volver a la presentación" className="shrink-0">
            <Logo size={26} />
          </Link>
          <span className="hidden rounded-full border border-dashed border-line px-2.5 py-0.5 text-xs font-semibold text-muted md:inline">Demo · datos ficticios</span>
          <nav aria-label="Perfiles de la demo" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-0.5 md:order-none md:ml-auto md:w-auto">
            {ROLES.map((r) => {
              const nuevos = eventos.filter((e) => e.para === r.rol).length - (vistos[r.rol] ?? 0);
              const activo = actual?.rol === r.rol;
              return (
                <Link
                  key={r.rol}
                  href={r.href}
                  aria-current={activo ? "page" : undefined}
                  className={cx(
                    "relative inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors",
                    activo ? "text-white" : "text-ink hover:bg-surface-2",
                  )}
                  style={activo ? { background: r.color } : undefined}
                >
                  {!activo && <span aria-hidden="true" className="size-2 rounded-full" style={{ background: r.color }} />}
                  {r.nombre}
                  {nuevos > 0 && !activo && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white" aria-label={`${nuevos} avisos nuevos`}>
                      {nuevos}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => {
              dispatch({ t: "reset" });
              setVistos({});
            }}
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink md:ml-0"
          >
            <IconRefresh size={16} aria-hidden="true" /> Reiniciar demo
          </button>
        </div>
      </header>

      {toast && (
        <div role="status" className="animate-toast fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-sm">
          <div className="flex gap-3 rounded-2xl bg-ink p-4 text-on-primary shadow-2xl">
            <span aria-hidden="true" className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: infoRol(toast.para).color, boxShadow: "0 0 0 3px rgba(255,255,255,.15)" }} />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-flow">Le llegó a {infoRol(toast.para).nombre}</span>
              <span className="text-sm leading-snug">{toast.texto}</span>
              {actual?.rol !== toast.para && (
                <Link href={infoRol(toast.para).href} onClick={() => setToast(null)} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-flow hover:underline">
                  Verlo como {infoRol(toast.para).corto} <IconArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
            <button onClick={() => setToast(null)} aria-label="Cerrar aviso" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/10">
              <IconX size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
