"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Superficie con luz que sigue al cursor.
 *
 * Es el recurso que usan las webs de producto premium (Linear, Vercel, Stripe)
 * para que una tarjeta deje de ser un rectángulo plano: el borde y un halo
 * interno se iluminan alrededor del puntero. Aporta profundidad y respuesta
 * táctil sin agregar ni un color nuevo a la paleta.
 *
 * El efecto es puramente decorativo: se apaga con `prefers-reduced-motion`,
 * no captura eventos y no altera el orden de foco ni la lectura del contenido.
 */
export default function Spotlight({
  children,
  className = "",
  radius = 380,
}: {
  children: React.ReactNode;
  className?: string;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const glow = pos
    ? `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, rgb(var(--brand-primary) / 0.14), transparent 70%)`
    : "none";

  const edge = pos
    ? `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, rgb(var(--brand-primary) / 0.55), transparent 65%)`
    : "none";

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      className={`spotlight group/spot relative ${className}`}
    >
      {/* Borde iluminado: se pinta por encima y se recorta al contorno. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 motion-reduce:hidden"
        style={{
          background: edge,
          padding: 1,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* Halo interno, muy tenue: da volumen sin lavar el texto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 motion-reduce:hidden"
        style={{ background: glow }}
      />
      {children}
    </div>
  );
}
