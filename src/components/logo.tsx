/* eslint-disable @next/next/no-img-element */
import { cx } from "./ui";

/**
 * Logo de BrokerFlow: la "B" que avanza (la imagen original) y el nombre en Figtree.
 * Sobre fondos claros la imagen se integra con mix-blend-mode; sobre oscuro va en una placa blanca.
 */
export function LogoMark({ size = 32, onDark }: { size?: number; onDark?: boolean }) {
  if (onDark)
    return (
      <span className="grid shrink-0 place-items-center rounded-[10px] bg-white" style={{ width: size + 8, height: size + 8 }}>
        <img src="/brand/mark.png" alt="" width={size} height={size} className="logo-blend" style={{ width: size * 0.78, height: "auto" }} />
      </span>
    );
  return <img src="/brand/mark.png" alt="" width={size} height={size} className="logo-blend shrink-0" style={{ width: size, height: "auto" }} />;
}

export function Logo({ size = 30, onDark, className }: { size?: number; onDark?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} onDark={onDark} />
      <span className={cx("font-extrabold tracking-[-0.01em]", onDark ? "text-white" : "text-ink")} style={{ fontSize: size * 0.62 }}>
        Broker<span className={onDark ? "text-primary-light" : "text-logo-blue"}>Flow</span>
      </span>
    </span>
  );
}
