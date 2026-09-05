"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Sistema de motion del sitio.
 *
 * Una sola curva, una sola distancia, una sola duración: lo que cambia es
 * CUÁNDO dispara, no cómo se ve. Esa es la regla que mantiene la coherencia
 * entre páginas.
 *
 *   mode="enter"   Above the fold: entra al montar, escalonado.
 *                  Se usa en los titulares de portada, que ya están en pantalla.
 *
 *   mode="scroll"  Below the fold: entra al aparecer, una sola vez.
 *                  Se usa en secciones y tarjetas, que se descubren bajando.
 *
 * Con `prefers-reduced-motion` no hay desplazamiento ni fundido: el contenido
 * se muestra directamente. Nada queda escondido esperando un observador.
 */

/** Curva única del sitio. Salida rápida y frenado largo. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** Distancia única: lo justo para que se note el asentamiento. */
const RISE = 16;
const DUR_ENTER = 0.5;
const DUR_SCROLL = 0.45;
/** Escalonado entre hermanos. Más que esto se percibe como demora. */
export const STAGGER = 0.08;

export default function Reveal({
  children,
  mode = "scroll",
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  mode?: "enter" | "scroll";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "ul" | "article" | "p";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  const shared = {
    initial: { opacity: 0, y: RISE },
    className,
    // Marca para que el CSS pueda neutralizar la animacion sin depender de JS:
    // durante la hidratacion useReducedMotion todavia no resolvio y el elemento
    // puede quedar en opacity 0 para quien pidio menos movimiento.
    "data-reveal": "",
  };

  if (mode === "enter") {
    return (
      <Tag
        {...shared}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR_ENTER, delay, ease: EASE }}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      {...shared}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: DUR_SCROLL, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}
