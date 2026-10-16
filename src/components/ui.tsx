"use client";

/** Componentes del design system de Brokerflow 1.0 */
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { iniciales } from "@/lib/format";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Ícono de Material Symbols Rounded por nombre (ej. "add", "payments") */
export function Icon({ name, size = 20, fill, className }: { name: string; size?: number; fill?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("icon", fill && "icon-fill", className)} style={{ fontSize: size }}>
      {name}
    </span>
  );
}

type Variant = "primary" | "secondary" | "emphasis" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "border border-line bg-surface text-ink hover:bg-bg",
  emphasis: "bg-ink text-white hover:bg-ink-2",
  danger: "border border-line bg-surface text-on-danger hover:bg-danger-soft",
  ghost: "text-ink-2 hover:bg-segment",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg"; icon?: string }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-[13px]" : size === "lg" ? "h-12 px-5 text-[15px]" : "h-10 px-4 text-sm",
        VARIANTS[variant],
        className,
      )}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 17 : 20} />}
      {children}
    </button>
  );
}

/** Chip de filtro (radio 999) */
export function Chip({ active, children, onClick, count }: { active?: boolean; children: ReactNode; onClick?: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
        active ? "bg-ink text-white" : "border border-line bg-surface text-ink-2 hover:bg-bg",
      )}
    >
      {children}
      {count !== undefined && <span className={cx("text-xs", active ? "text-white/70" : "text-faint")}>{count}</span>}
    </button>
  );
}

/** Control segmentado (opciones excluyentes) */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string; icon?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-[11px] bg-segment p-[3px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex min-h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1 text-center text-[13px] leading-tight font-semibold transition-colors",
              on ? "bg-surface text-ink shadow-[0_1px_2px_rgba(21,26,61,.12)]" : "text-muted hover:text-ink",
            )}
          >
            {o.icon && <Icon name={o.icon} size={17} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export type Tone = "neutral" | "primary" | "ok" | "warn" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-segment text-muted",
  primary: "bg-primary-soft text-primary-hover",
  ok: "bg-ok-soft text-on-ok",
  warn: "bg-warn-soft text-on-warn",
  danger: "bg-danger-soft text-on-danger",
  info: "bg-info-soft text-on-info",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: string }) {
  return (
    <span className={cx("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", TONES[tone], className)}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-surface", className)}>{children}</div>;
}

export function Avatar({ nombre, size = 36, tone = "primary" }: { nombre: string; size?: number; tone?: "primary" | "ink" }) {
  return (
    <span
      aria-hidden="true"
      className={cx("grid shrink-0 place-items-center rounded-full font-bold", tone === "primary" ? "bg-primary-soft text-primary-hover" : "bg-ink text-white")}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {iniciales(nombre)}
    </span>
  );
}

/** Ícono cuadrado del ramo o del tipo de trámite */
export function IconTile({ name, tone = "primary", size = 40 }: { name: string; tone?: Tone; size?: number }) {
  return (
    <span className={cx("grid shrink-0 place-items-center rounded-[11px]", TONES[tone])} style={{ width: size, height: size }}>
      <Icon name={name} fill size={size * 0.55} />
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="m-0 text-[26px] leading-tight font-bold tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "neutral", icon, bar }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: string; bar?: number }) {
  const color: Record<Tone, string> = { neutral: "text-ink", primary: "text-primary", ok: "text-on-ok", warn: "text-on-warn", danger: "text-on-danger", info: "text-on-info" };
  const barColor: Record<Tone, string> = { neutral: "bg-ink", primary: "bg-primary", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger", info: "bg-info" };
  return (
    <Card className="flex flex-col gap-1.5 p-[18px]">
      <span className={cx("flex items-center gap-1.5 text-[13px] font-semibold", tone === "neutral" ? "text-muted" : color[tone])}>
        {icon && <Icon name={icon} size={17} />}
        {label}
      </span>
      <span className="text-[28px] leading-none font-extrabold tracking-[-0.01em]">{value}</span>
      {bar !== undefined && (
        <span className="mt-1 h-1.5 overflow-hidden rounded-full bg-segment">
          <span className={cx("block h-full rounded-full", barColor[tone])} style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
        </span>
      )}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </Card>
  );
}

/** Pasos de un trámite o un asistente */
export function Steps({ steps, current, compact }: { steps: string[]; current: number; compact?: boolean }) {
  return (
    <ol className="flex gap-1.5" aria-label={`Paso ${current + 1} de ${steps.length}: ${steps[current]}`}>
      {steps.map((p, i) => (
        <li key={p} className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={cx("h-1.5 rounded-full", i < current ? "bg-primary" : i === current ? "bg-primary" : "bg-segment")} />
          {!compact && <span className={cx("truncate text-xs", i === current ? "font-bold text-ink" : i < current ? "font-semibold text-muted" : "text-faint")}>{p}</span>}
        </li>
      ))}
    </ol>
  );
}

/** Ventana modal accesible: cierra con Escape o tocando afuera, y lleva el foco adentro. */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button:not([data-close])")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cx("max-h-[92vh] w-full overflow-y-auto rounded-t-[20px] bg-surface p-5 shadow-2xl sm:rounded-[18px] sm:p-6", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="m-0 text-xl font-bold tracking-[-0.01em]">{title}</h2>
          <button data-close onClick={onClose} aria-label="Cerrar" className="grid size-9 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-segment">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-2">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-[42px] w-full rounded-[10px] border border-input bg-surface px-3 text-[15px] font-medium text-ink placeholder:font-normal placeholder:text-faint focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-soft)] focus:outline-none";

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <IconTile name={icon} tone="neutral" size={48} />
      <span className="mt-1 font-bold">{title}</span>
      {children && <span className="max-w-sm text-sm text-muted">{children}</span>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-sm text-muted" aria-live="polite">
      Preparando la demo…
    </div>
  );
}
