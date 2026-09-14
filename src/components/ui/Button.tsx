import { forwardRef } from "react";

type Variante = "primary" | "default" | "danger" | "ghost" | "success";
type Tamano = "sm" | "md";

const BASE = "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-semibold " +
  "transition-[transform,box-shadow,background,color,border-color] duration-[var(--t-fast)] " +
  "disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap";

const VARIANTES: Record<Variante, string> = {
  primary: "text-white bg-[linear-gradient(135deg,var(--brand),var(--accent))] shadow-[var(--shadow-sm)] " +
    "hover:shadow-[var(--shadow-hover)] hover:-translate-y-px",
  default: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-strong)] " +
    "hover:shadow-[var(--shadow-hover)] hover:-translate-y-px",
  danger: "bg-[var(--surface)] text-[var(--status-critical)] border border-[var(--border-strong)] " +
    "hover:border-[var(--status-critical)]",
  success: "text-white bg-[var(--status-good)] shadow-[var(--shadow-sm)] " +
    "hover:shadow-[var(--shadow-hover)] hover:-translate-y-px",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "text-[12.5px] px-2.5 py-1.5",
  md: "text-[13.5px] px-3.5 py-2",
};

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
}>(function Button({ variante = "default", tamano = "md", className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...props}
    />
  );
});
