"use client";

export function StatTile({
  label,
  value,
  icon,
  tono,
}: {
  label: string;
  value: string | number;
  icon: string;
  tono: string;
}) {
  const largo = String(value).length > 11;
  return (
    <div
      className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]
                 bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-transform duration-[var(--t)]
                 hover:-translate-y-[3px] hover:shadow-[var(--shadow-hover)]"
      style={{ ["--tile-accent" as string]: tono }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-[34px] -top-[34px] h-[92px] w-[92px] rounded-full opacity-[.09]
                   transition-[transform,opacity] duration-[var(--t-slow)] group-hover:scale-[1.35] group-hover:opacity-[.16]"
        style={{ background: tono }}
      />
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[.22] transition-transform duration-[var(--t-slow)] group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${tono}, color-mix(in srgb, ${tono} 45%, var(--accent)))` }}
      />
      <div
        className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-[11px] text-base
                   transition-transform duration-[var(--t)] ease-[var(--ease-bounce)] group-hover:scale-[1.12] group-hover:-rotate-6"
        style={{ background: `color-mix(in srgb, ${tono} 12%, transparent)`, color: tono }}
      >
        {icon}
      </div>
      <div className="text-[11.5px] font-semibold tracking-[.01em] text-[var(--text-secondary)]">{label}</div>
      <div className={`font-extrabold leading-[1.1] text-[var(--text-primary)] ${largo ? "text-[23px]" : "text-[31px]"}`}>
        {value}
      </div>
    </div>
  );
}
