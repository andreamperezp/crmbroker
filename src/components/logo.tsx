/** Marca de Brokerflow: dos trazos que fluyen, como un caso que pasa de mano en mano sin cortarse. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path d="M7 19c3.5-6 7-6 9 0s5.5 6 9 0" fill="none" stroke="var(--flow)" strokeWidth="3" strokeLinecap="round" />
      <path d="M7 13c3.5-6 7-6 9 0s5.5 6 9 0" fill="none" stroke="var(--on-primary)" strokeWidth="3" strokeLinecap="round" opacity=".9" />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-display text-lg font-bold tracking-tight">
        broker<span className="text-flow">flow</span>
      </span>
    </span>
  );
}
