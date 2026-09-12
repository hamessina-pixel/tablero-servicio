export function Card({
  className = "",
  children,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]
                  p-5 shadow-[var(--shadow-card)] transition-shadow duration-[var(--t)] ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[13px] font-bold text-[var(--text-primary)] ${className}`}>{children}</p>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between gap-3">{children}</div>;
}
