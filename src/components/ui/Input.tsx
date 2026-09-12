import { forwardRef } from "react";

const BASE = "w-full rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] " +
  "px-3 py-2 text-[13.5px] text-[var(--text-primary)] transition-shadow duration-[var(--t-fast)] " +
  "focus:outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_4px_var(--brand-glow)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${BASE} ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select ref={ref} className={`${BASE} ${className}`} {...props}>
        {children}
      </select>
    );
  },
);
