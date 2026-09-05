"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { getSiteContent } from "@/content/site";

type SiteContentView = ReturnType<typeof getSiteContent>;

/** Capturas reales de producto: son la prueba más rápida de calidad que tenemos. */
const SHOWCASE = [
  {
    src: "/projects/pediacore.png",
    name: "PediaCore",
    alt: "PediaCore — plataforma de gestión para consultorios",
    slug: "pediacore",
  },
  {
    src: "/projects/my-marketing-agency.png",
    name: "My Marketing Agency",
    alt: "My Marketing Agency — panel de operación",
    slug: "my-marketing-agency",
  },
  {
    src: "/projects/ferrelonstock.png",
    name: "FerrelonStock",
    alt: "FerrelonStock — e-commerce y gestión de inventario",
    slug: "ferrelonstock",
  },
];

/** Posición de cada captura en la pila, según su distancia al frente. */
/** Abanico en arco: la primera baja, la del medio sube, la tercera vuelve a bajar. */
const SLOTS_ANCHO = [
  { x: "6%", y: "0%", rotate: 0, scale: 1, opacity: 1, zIndex: 30 },
  { x: "35%", y: "-13%", rotate: 4, scale: 0.87, opacity: 0.78, zIndex: 20 },
  { x: "58%", y: "3%", rotate: 10, scale: 0.77, opacity: 0.5, zIndex: 10 },
];

/** Pila casi plana: en pantalla angosta la captura vale mas que el efecto. */
const SLOTS_ANGOSTO = [
  { x: "0%", y: "0%", rotate: 0, scale: 1, opacity: 1, zIndex: 30 },
  { x: "7%", y: "-5%", rotate: 2, scale: 0.95, opacity: 0.65, zIndex: 20 },
  { x: "13%", y: "-10%", rotate: 4, scale: 0.9, opacity: 0.4, zIndex: 10 },
];

const proof = {
  es: ["Desde USD 450", "Entrega en 1 a 2 semanas", "30 días de soporte"],
  en: ["From USD 450", "Delivered in 1 to 2 weeks", "30 days of support"],
};

export default function HeroEditorial({
  content,
  locale = "es",
}: {
  content: SiteContentView;
  locale?: string;
}) {
  const reduce = useReducedMotion();
  const [front, setFront] = useState(0);
  const [esAncho, setEsAncho] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const leer = () => setEsAncho(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);
  // La rotación se congela mientras el puntero está encima o el foco está
  // dentro, para que nadie pierda la tarjeta que estaba mirando.
  const [held, setHeld] = useState(false);
  const resumeAt = useRef(0);

  /** Selección manual: fija la tarjeta y pausa el giro un rato. */
  const pick = useCallback((i: number) => {
    setFront(i);
    resumeAt.current = Date.now() + 9000;
  }, []);

  useEffect(() => {
    if (reduce || held) return;
    const id = window.setInterval(() => {
      if (Date.now() < resumeAt.current) return;
      setFront((f) => (f + 1) % SHOWCASE.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [reduce, held]);
  const points = locale === "en" ? proof.en : proof.es;

  const [primary, secondary] = content.home.ctas;

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative -mt-28 overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-dim)/0.72),rgb(var(--background)/0.92))] pt-28 sm:-mt-[7.5rem] sm:pt-[7.5rem]">
      {/* El mismo resplandor que usan las paginas internas, para que el primer
          plano del home no se lea con otra paleta. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgb(var(--brand-primary)/0.16),transparent_26%),radial-gradient(circle_at_82%_24%,rgb(var(--brand-secondary)/0.14),transparent_28%),linear-gradient(180deg,rgb(var(--surface-contrast)/0.18),transparent_34%)]" />

      <div className="site-container relative grid gap-8 pb-12 pt-4 sm:gap-12 sm:pb-16 sm:pt-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-[auto_auto] lg:items-start lg:gap-x-10 lg:gap-y-6 lg:pb-20 lg:pt-2">
        {/* ---------------- Columna de mensaje ---------------- */}
        <div className="order-1 lg:col-start-1 lg:row-start-1">
          {/* La promesa ocupa el lugar del nombre: quien llega desde LinkedIn ya sabe quién sos. */}
          <motion.h1
            {...rise(0.08)}
            className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.02em] text-text-primary sm:text-5xl lg:text-[3.4rem]"
          >
            {content.home.subtitle}
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-4 max-w-xl text-base leading-7 text-text-secondary sm:mt-6 sm:text-lg sm:leading-8"
          >
            {content.home.intro}
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-6 flex flex-nowrap gap-2.5 sm:flex-wrap sm:gap-3 sm:mt-9">
            {primary ? (
              <Link href={primary.href} className="button-primary flex-1 justify-center text-center sm:flex-none sm:min-w-[13.5rem]">
                {primary.label}
              </Link>
            ) : null}
            {secondary ? (
              <Link href={secondary.href} className="button-secondary flex-1 justify-center text-center sm:flex-none sm:min-w-[13.5rem]">
                {secondary.label}
              </Link>
            ) : null}
          </motion.div>

        </div>

        {/* ---------------- Pila de proyectos, rotable ---------------- */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, scale: 0.97 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const },
              })}
          className="relative order-2 mx-auto w-full max-w-[38rem] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={() => setHeld(false)}
        >
          <div className="relative aspect-[4/2.9] lg:aspect-[4/2.1]">
            {SHOWCASE.map((shot, i) => {
              // Distancia al frente: define en qué ranura de la pila cae.
              const depth = (i - front + SHOWCASE.length) % SHOWCASE.length;
              const slot = (esAncho ? SLOTS_ANCHO : SLOTS_ANGOSTO)[depth];
              const isFront = depth === 0;

              return (
                <motion.button
                  key={shot.src}
                  type="button"
                  onClick={() => {
                    const target =
                      document.getElementById(shot.slug) ??
                      document.getElementById("proyectos");
                    target?.scrollIntoView({
                      behavior: reduce ? "auto" : "smooth",
                      block: "start",
                    });
                  }}
                  aria-label={`${locale === "en" ? "Go to" : "Ir a"} ${shot.name}`}
                  aria-current={isFront || undefined}
                  className={`absolute bottom-0 left-0 w-[88%] origin-bottom-left lg:w-[72%] overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-surface-dim text-left shadow-[0_30px_70px_-26px_rgba(0,0,0,0.9)] ${
                    "cursor-pointer"
                  }`}
                  animate={reduce ? undefined : slot}
                  style={reduce ? { zIndex: slot.zIndex, opacity: slot.opacity } : { zIndex: slot.zIndex }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-center gap-1.5 border-b border-outline-ghost/12 bg-[rgb(var(--background)/0.5)] px-3.5 py-2.5">
                    <span className="h-2 w-2 rounded-full bg-text-tertiary/35" />
                    <span className="h-2 w-2 rounded-full bg-text-tertiary/25" />
                    <span className="h-2 w-2 rounded-full bg-text-tertiary/20" />
                  </div>
                  <div className="relative aspect-[16/10.5]">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      fill
                      sizes="(max-width: 1024px) 83vw, 38vw"
                      className="object-cover object-left-top"
                      priority={i === 0}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Control del carrusel. Sin texto ni nombres: el hero muestra, la
              sección de proyectos explica. */}
          <div className="relative z-40 mt-8 flex items-center justify-end">
            <div className="flex items-center gap-2">
              {SHOWCASE.map((shot, i) => (
                <button
                  key={shot.src}
                  type="button"
                  onClick={() => pick(i)}
                  aria-label={`${locale === "en" ? "Show" : "Mostrar"} ${shot.name}`}
                  aria-current={i === front || undefined}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === front ? "w-7 bg-brand-primary" : "w-3 bg-outline-ghost/40 hover:bg-outline-ghost/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Precio en la primera pantalla: filtra y da confianza antes del scroll.
            En telefono va DESPUES de las capturas: mostrar el trabajo pesa mas
            que la linea de precios, que igual se ve al bajar. */}
        <motion.ul
            {...rise(0.32)}
            className="order-3 mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-outline-ghost/10 pt-5 lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-0 lg:gap-x-6 lg:pt-6"
          >
            {points.map((point) => (
              <li
                key={point}
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
              >
                <span aria-hidden="true" className="mr-2 text-brand-primary">
                  ·
                </span>
                {point}
              </li>
            ))}
          </motion.ul>
      </div>
    </section>
  );
}
