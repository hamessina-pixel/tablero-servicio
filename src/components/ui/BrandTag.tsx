import { textoSobre } from "@/lib/color";

const LOGOS: Record<string, string> = {
  BAIC: "/logos/baic.jpg",
  ARCFOX: "/logos/arcfox.avif",
};

export function BrandTag({
  nombre,
  color,
  grande = false,
  onClick,
}: {
  nombre: string;
  color: string;
  grande?: boolean;
  onClick?: () => void;
}) {
  const logo = LOGOS[nombre];
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      type={onClick ? "button" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] font-bold transition-transform
                  duration-[var(--t-fast)] ${grande ? "px-3.5 py-2 text-[13px]" : "px-2.5 py-1 text-[11.5px]"}
                  ${onClick ? "cursor-pointer hover:-translate-y-px hover:scale-[1.03]" : ""}`}
      style={{ background: color, color: textoSobre(color) }}
    >
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className={grande ? "h-4" : "h-3"} />
      )}
      {nombre}
    </Tag>
  );
}
