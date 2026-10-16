"use client";

/**
 * Estructura de la demo: barra superior con "Ver como" (cambia de perfil en un toque),
 * menú lateral de cada perfil con contadores en vivo, y avisos cuando una acción le
 * llega a otro perfil, que es lo que muestra cómo se conecta todo.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, useMemo } from "react";
import { Logo } from "@/components/logo";
import { Avatar, Icon, Segmented, cx } from "@/components/ui";
import { ROLES, infoRol, rolDe } from "@/lib/roles";
import { useDemo } from "@/lib/store";
import type { Evento, Rol } from "@/lib/types";

export function AppShell({ children }: { children: ReactNode }) {
  const { s, dispatch } = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const actual = rolDe(pathname) ?? ROLES[0];
  const eventos = useMemo(() => s?.eventos ?? [], [s?.eventos]);

  // Cuántos avisos vio cada perfil: lo nuevo se cuenta en su pestaña
  const [vistos, setVistos] = useState<Partial<Record<Rol, number>>>({});
  const delRol = eventos.filter((e) => e.para === actual.rol).length;
  if (vistos[actual.rol] !== delRol) setVistos({ ...vistos, [actual.rol]: delRol });

  // Aviso flotante con el último evento
  const [toast, setToast] = useState<Evento | null>(null);
  const ultimo = useRef(0);
  useEffect(() => {
    if (eventos.length > ultimo.current) {
      setToast(eventos[eventos.length - 1]);
      ultimo.current = eventos.length;
      const t = setTimeout(() => setToast(null), 7000);
      return () => clearTimeout(t);
    }
    ultimo.current = eventos.length;
  }, [eventos]);

  // En pantallas angostas, que el perfil y la sección activos queden a la vista
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("header nav [aria-current=page], nav[aria-label=Secciones] [aria-current=page], .mnav [aria-current=page]").forEach((el) => el.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }, [pathname]);

  const usuario = s ? actual.usuario(s) : null;
  const vista = pathname.split("/")[2];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="flex min-h-16 flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-5">
          <Link href="/" aria-label="BrokerFlow, volver al inicio" className="shrink-0">
            <Logo size={30} />
          </Link>
          <div className="order-3 flex w-full min-w-0 items-center gap-2 overflow-x-auto lg:order-none lg:w-auto">
            <span className="hidden text-xs font-semibold whitespace-nowrap text-faint sm:inline">Ver como</span>
            <nav aria-label="Perfiles de la demo" className="flex gap-0.5 rounded-[11px] bg-segment p-[3px]">
              {ROLES.map((r) => {
                const on = r.rol === actual.rol;
                const nuevos = eventos.filter((e) => e.para === r.rol).length - (vistos[r.rol] ?? 0);
                return (
                  <Link
                    key={r.rol}
                    href={r.href}
                    aria-current={on ? "page" : undefined}
                    className={cx(
                      "relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                      on ? "bg-surface text-ink shadow-[0_1px_2px_rgba(21,26,61,.12)]" : "text-muted hover:text-ink",
                    )}
                  >
                    <Icon name={r.icon} size={17} />
                    {r.corto}
                    {!on && nuevos > 0 && (
                      <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white" aria-label={`${nuevos} avisos nuevos`}>
                        {nuevos}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            {actual.rol === "cliente" && s && (
              <div className="hidden sm:block">
                <Segmented
                  label="Ver la autogestión en"
                  value={s.movil ? "movil" : "web"}
                  onChange={(v) => dispatch({ t: "ui/movil", movil: v === "movil" })}
                  options={[
                    { value: "web", label: "Web", icon: "desktop_windows" },
                    { value: "movil", label: "Mobile", icon: "smartphone" },
                  ]}
                />
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-auto">
            <button
              onClick={() => {
                dispatch({ t: "reset" });
                setVistos({});
              }}
              className="flex h-9 items-center gap-1.5 rounded-[9px] px-2.5 text-[13px] font-semibold text-muted hover:bg-segment hover:text-ink"
              title="Vuelve a los datos iniciales"
            >
              <Icon name="restart_alt" size={18} />
              <span className="hidden sm:inline">Reiniciar demo</span>
            </button>
            {usuario && (
              <div className="flex items-center gap-2.5">
                <Avatar nombre={usuario.nombre} />
                <div className="hidden flex-col leading-tight md:flex">
                  <span className="text-sm font-semibold whitespace-nowrap">{usuario.nombre}</span>
                  <span className="text-xs font-medium text-faint">{usuario.cargo}</span>
                </div>
              </div>
            )}
            <button onClick={() => router.push("/")} aria-label="Salir de la demo" title="Salir" className="grid size-9 place-items-center rounded-[9px] text-muted hover:bg-segment hover:text-ink">
              <Icon name="logout" size={19} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {actual.nav.length > 0 && (
          <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-surface p-3 lg:flex" aria-label={`Menú de ${actual.nombre}`}>
            <span className="px-3 pt-2 pb-2 text-xs font-bold tracking-[0.08em] text-faint uppercase">{actual.nombre}</span>
            {actual.nav.map((n) => (
              <NavLink key={n.id} rol={actual.rol} item={n} on={vista === n.id} count={s && n.badge ? n.badge(s) : 0} />
            ))}
            <p className="mt-auto rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
              Demo con datos ficticios. Cada acción se refleja en los otros perfiles: probá cambiar arriba en &quot;Ver como&quot;.
            </p>
          </aside>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          {actual.nav.length > 0 && (
            <nav aria-label={`Menú de ${actual.nombre}`} className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 lg:hidden">
              {actual.nav.map((n) => {
                const on = vista === n.id;
                const count = s && n.badge ? n.badge(s) : 0;
                return (
                  <Link key={n.id} href={`${hrefBase(actual.rol)}/${n.id}`} aria-current={on ? "page" : undefined} className={cx("flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold", on ? "bg-primary-soft text-primary-hover" : "text-ink-2")}>
                    <Icon name={n.icon} size={17} fill={on} />
                    {n.label}
                    {count > 0 && <span className={cx("rounded-full px-1.5 text-[11px]", n.alert ? "bg-danger-soft text-on-danger" : "bg-segment text-primary-hover")}>{count}</span>}
                  </Link>
                );
              })}
            </nav>
          )}
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-6 pb-24 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      {toast && (
        <div role="status" className="animate-toast fixed right-4 bottom-4 left-4 z-50 sm:left-auto sm:max-w-sm">
          <div className="flex gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/10">
              <Icon name={infoRol(toast.para).icon} size={19} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-bold tracking-wide text-primary-light uppercase">Le llegó a {infoRol(toast.para).nombre}</span>
              <span className="text-sm leading-snug">{toast.texto}</span>
              {actual.rol !== toast.para && (
                <Link href={infoRol(toast.para).href} onClick={() => setToast(null)} className="mt-1 inline-flex items-center gap-1 self-start text-sm font-semibold text-primary-light hover:underline">
                  Verlo como {infoRol(toast.para).corto} <Icon name="arrow_forward" size={16} />
                </Link>
              )}
            </div>
            <button onClick={() => setToast(null)} aria-label="Cerrar aviso" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/10">
              <Icon name="close" size={17} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const hrefBase = (rol: Rol) => ({ asesor: "/asesor", admin: "/administracion", cobranzas: "/cobranzas", cliente: "/autogestion" })[rol];

function NavLink({ rol, item, on, count }: { rol: Rol; item: { id: string; label: string; icon: string; alert?: boolean }; on: boolean; count: number }) {
  return (
    <Link
      href={`${hrefBase(rol)}/${item.id}`}
      aria-current={on ? "page" : undefined}
      className={cx("flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors", on ? "bg-primary-soft text-primary-hover" : "text-ink-2 hover:bg-bg")}
    >
      <Icon name={item.icon} size={20} fill={on} />
      <span className="flex-1">{item.label}</span>
      {count > 0 && (
        <span className={cx("grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-xs font-bold", item.alert ? "bg-danger-soft text-on-danger" : on ? "bg-surface text-primary-hover" : "bg-segment text-primary-hover")}>
          {count}
        </span>
      )}
    </Link>
  );
}
