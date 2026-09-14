"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/Input";

/**
 * Campo de búsqueda con una cruz para vaciarlo. En el taller se busca un
 * código atrás de otro: borrar a mano lo anterior es un estorbo, sobre todo
 * con guantes o desde el celular.
 */
export const InputBusqueda = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLimpiar: () => void;
    className?: string;
  }
>(function InputBusqueda({ value, onChange, onLimpiar, className = "", ...props }, ref) {
  return (
    <div className={`relative ${className}`}>
      <Input
        ref={ref}
        value={value}
        onChange={onChange}
        // Deja lugar a la cruz para que no se superponga con el texto.
        className={value ? "!pr-9" : ""}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={onLimpiar}
          aria-label="Borrar la búsqueda"
          title="Borrar"
          className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full
                     text-[15px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          &times;
        </button>
      )}
    </div>
  );
});
