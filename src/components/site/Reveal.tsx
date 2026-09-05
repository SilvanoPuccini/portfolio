"use client";

import { motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";

/**
 * Marca de "estoy dentro de una secuencia".
 *
 * Framer solo orquesta a un hijo si el hijo NO declara su propio `animate`:
 * en cuanto lo declara se maneja solo y el staggerChildren del padre deja de
 * aplicar. Por eso el hijo tiene que saber si esta dentro de un grupo.
 */
const EnGrupo = createContext(false);

/**
 * Sistema de motion del sitio.
 *
 * Una sola curva, una sola distancia, una sola duración: lo que cambia es
 * CUÁNDO dispara, no cómo se ve.
 *
 *   <RevealGroup>  Secuencia. Sus hijos <Reveal> entran uno tras otro.
 *   <Reveal>       Bloque suelto: entra al aparecer en pantalla.
 *
 * El escalonado lo gobierna el grupo con `staggerChildren`, no un retardo
 * calculado en cada hijo. Con retardos manuales cada elemento medía el tiempo
 * por su cuenta y varios terminaban disparando juntos: la portada del home
 * cascadeaba y las internas aparecían de golpe. Delegar la secuencia al padre
 * la vuelve determinista.
 *
 * Con `prefers-reduced-motion` no hay desplazamiento ni fundido: el contenido
 * se muestra directamente. Nada queda escondido esperando un observador.
 */

/** Curva única del sitio. Salida rápida y frenado largo. */
const EASE = [0.22, 1, 0.36, 1] as const;
/** Distancia única: lo justo para que se note el asentamiento. */
const RISE = 16;
const DURATION = 0.5;
/** Escalonado entre hermanos. Más que esto se percibe como demora. */
export const STAGGER = 0.08;

type Tag = "div" | "section" | "li" | "ul" | "article" | "p";

const itemVariants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};

const groupVariants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

/**
 * Contenedor de secuencia: sus hijos `Reveal` heredan el orden de entrada.
 *
 * `mode="enter"` arranca al montar (portadas, que ya están en pantalla);
 * `mode="scroll"` espera a que el grupo entre en vista.
 */
export function RevealGroup({
  children,
  mode = "enter",
  className,
  as = "div",
}: {
  children: ReactNode;
  mode?: "enter" | "scroll";
  className?: string;
  as?: Tag;
}) {
  const reduce = useReducedMotion();
  const Motion = motion[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <EnGrupo.Provider value>
      <Motion
        className={className}
        data-reveal=""
        variants={groupVariants}
        initial="hidden"
        {...(mode === "enter"
          ? { animate: "show" }
          : { whileInView: "show", viewport: { once: true, amount: 0.35 } })}
      >
        {children}
      </Motion>
    </EnGrupo.Provider>
  );
}

export default function Reveal({
  children,
  mode = "scroll",
  className,
  as = "div",
}: {
  children: ReactNode;
  /** Ignorado dentro de un RevealGroup: ahí la secuencia la marca el padre. */
  mode?: "enter" | "scroll";
  className?: string;
  as?: Tag;
}) {
  const reduce = useReducedMotion();
  const enGrupo = useContext(EnGrupo);
  const Motion = motion[as];

  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  // Dentro de un grupo el hijo solo aporta sus variantes: quien dispara y en
  // que orden es el padre. Declarar initial/animate aca lo volveria autonomo.
  const orquestacion = enGrupo
    ? {}
    : {
        initial: "hidden" as const,
        ...(mode === "enter"
          ? { animate: "show" as const }
          : {
              whileInView: "show" as const,
              viewport: { once: true, amount: 0.35 },
            }),
      };

  return (
    <Motion
      className={className}
      // Marca para que el CSS pueda neutralizar la animación sin depender de JS:
      // durante la hidratación useReducedMotion todavía no resolvió y el
      // elemento puede quedar en opacity 0 para quien pidió menos movimiento.
      data-reveal=""
      variants={itemVariants}
      {...orquestacion}
    >
      {children}
    </Motion>
  );
}
