"use client";

import Image from "next/image";
import fotoPerfil from "@/assets/images/foto_perfil_ok01.png";
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
const SLOTS = [
  { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 30 },
  { x: "9%", y: -26, scale: 0.94, opacity: 0.55, zIndex: 20 },
  { x: "17%", y: -48, scale: 0.88, opacity: 0.3, zIndex: 10 },
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
  // La rotación se congela mientras el puntero está encima o el foco está
  // dentro, para que nadie pierda la tarjeta que estaba mirando.
  const [held, setHeld] = useState(false);
  const resumeAt = useRef(0);

  /** Selección manual: fija la tarjeta y pausa el giro un rato. */
  const pick = useCallback((i: number) => {
    setFront(i);
    resumeAt.current = Date.now() + 12000;
  }, []);

  useEffect(() => {
    if (reduce || held) return;
    const id = window.setInterval(() => {
      if (Date.now() < resumeAt.current) return;
      setFront((f) => (f + 1) % SHOWCASE.length);
    }, 5200);
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
    <section className="relative overflow-hidden">
      {/* Luz ambiente: da profundidad sin competir con el contenido */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[68rem] -translate-x-1/2 rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            "radial-gradient(closest-side, rgb(var(--brand-primary) / 0.18), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[80rem] gap-14 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,0.92fr)] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
        {/* ---------------- Columna de mensaje ---------------- */}
        <div>
          {/* Identidad: la cara de quien responde. Vender servicios es vender confianza. */}
          <motion.div {...rise(0)} className="flex items-center gap-4">
            <Image
              src={fotoPerfil}
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 rounded-full border border-outline-ghost/25 object-cover sm:h-[4.5rem] sm:w-[4.5rem]"
              placeholder="blur"
              priority
            />
            <div>
              <p className="text-xl font-semibold leading-tight tracking-[-0.015em] text-text-primary sm:text-2xl">
                {content.home.title}
              </p>
              <p className="mt-1 section-eyebrow">
                {locale === "en" ? "Full stack developer" : "Desarrollador full stack"}
              </p>
            </div>
          </motion.div>

          {/* La promesa ocupa el lugar del nombre: quien llega desde LinkedIn ya sabe quién sos. */}
          <motion.h1
            {...rise(0.08)}
            className="mt-8 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-text-primary sm:text-5xl lg:text-[3.4rem]"
          >
            {content.home.subtitle}
          </motion.h1>

          <motion.p
            {...rise(0.16)}
            className="mt-6 section-lede"
          >
            {content.home.intro}
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex flex-wrap gap-3">
            {primary ? (
              <Link href={primary.href} className="button-primary sm:min-w-[13.5rem]">
                {primary.label}
              </Link>
            ) : null}
            {secondary ? (
              <Link href={secondary.href} className="button-secondary sm:min-w-[13.5rem]">
                {secondary.label}
              </Link>
            ) : null}
          </motion.div>

          {/* Precio en la primera pantalla: filtra y da confianza antes del scroll. */}
          <motion.ul
            {...rise(0.32)}
            className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-outline-ghost/10 pt-6"
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

        {/* ---------------- Pila de proyectos, rotable ---------------- */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, scale: 0.97 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const },
              })}
          className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={() => setHeld(false)}
        >
          <div className="relative aspect-[4/3.35]">
            {SHOWCASE.map((shot, i) => {
              // Distancia al frente: define en qué ranura de la pila cae.
              const depth = (i - front + SHOWCASE.length) % SHOWCASE.length;
              const slot = SLOTS[depth];
              const isFront = depth === 0;

              return (
                <motion.button
                  key={shot.src}
                  type="button"
                  onClick={() => {
                    if (!isFront) {
                      pick(i);
                      return;
                    }
                    document
                      .getElementById("proyectos")
                      ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
                  }}
                  aria-label={
                    isFront
                      ? locale === "en"
                        ? "Go to the projects section"
                        : "Ir a la sección de proyectos"
                      : `${locale === "en" ? "Bring to front" : "Traer al frente"}: ${shot.name}`
                  }
                  aria-current={isFront || undefined}
                  className={`absolute bottom-0 left-0 w-[83%] origin-bottom-left overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-surface-dim text-left shadow-[0_30px_70px_-26px_rgba(0,0,0,0.9)] ${
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
          <div className="mt-6 flex items-center justify-end">
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
      </div>
    </section>
  );
}
