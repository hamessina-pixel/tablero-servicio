const ESTILOS = {
  good: { bg: "var(--cz-bg-success, color-mix(in oklab, var(--status-good) 14%, transparent))", text: "var(--status-good)" },
  warning: { bg: "var(--cz-bg-warning)", text: "var(--cz-text-warning)" },
  critical: { bg: "color-mix(in oklab, var(--status-critical) 14%, transparent)", text: "var(--status-critical)" },
  neutral: { bg: "var(--surface-2)", text: "var(--text-muted)" },
  accent: { bg: "var(--cz-bg-accent)", text: "var(--cz-text-accent)" },
} as const;

export function Badge({
  tono = "neutral",
  dot = false,
  title,
  children,
}: {
  tono?: keyof typeof ESTILOS;
  dot?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  const e = ESTILOS[tono];
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: e.bg, color: e.text }}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.text }} />}
      {children}
    </span>
  );
}
