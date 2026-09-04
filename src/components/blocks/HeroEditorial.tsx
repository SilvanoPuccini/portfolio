"use client";

import Image from "next/image";
import fotoPerfil from "@/assets/images/foto_perfil_ok01.png";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { getSiteContent } from "@/content/site";

type SiteContentView = ReturnType<typeof getSiteContent>;

/** Capturas reales de producto: son la prueba más rápida de calidad que tenemos. */
const SHOWCASE = [
  { src: "/projects/pediacore.png", alt: "PediaCore — plataforma de gestión para consultorios" },
  { src: "/projects/my-marketing-agency.png", alt: "My Marketing Agency — panel de operación" },
  { src: "/projects/ferrelonstock.png", alt: "FerrelonStock — e-commerce y gestión de inventario" },
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

        {/* ---------------- Composición de producto ---------------- */}
        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, scale: 0.97 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] as const },
              })}
          className="relative mx-auto w-full max-w-[34rem] lg:max-w-none"
          aria-label={locale === "en" ? "Recent work" : "Trabajo reciente"}
        >
          <div className="relative aspect-[4/3.2]">
            {/* Secundaria: asoma detrás para dar profundidad, nunca compite. */}
            <motion.figure
              className="absolute right-0 top-0 h-[62%] w-[72%] overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/12 bg-surface-dim opacity-70 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.8)]"
              {...(reduce ? {} : { whileHover: { y: -6, opacity: 0.9, transition: { duration: 0.3 } } })}
            >
              <Image
                src={SHOWCASE[1].src}
                alt={SHOWCASE[1].alt}
                fill
                sizes="(max-width: 1024px) 60vw, 30vw"
                className="object-cover object-left-top"
              />
            </motion.figure>

            {/* Principal: encuadrada como ventana de navegador, legible y entera. */}
            <motion.figure
              className="absolute bottom-0 left-0 w-[88%] overflow-hidden rounded-[var(--radius-soft)] border border-outline-ghost/20 bg-surface-dim shadow-[0_30px_70px_-26px_rgba(0,0,0,0.9)]"
              {...(reduce ? {} : { whileHover: { y: -8, transition: { duration: 0.3 } } })}
            >
              <div className="flex items-center gap-1.5 border-b border-outline-ghost/12 bg-[rgb(var(--background)/0.5)] px-3.5 py-2.5">
                <span className="h-2 w-2 rounded-full bg-text-tertiary/35" />
                <span className="h-2 w-2 rounded-full bg-text-tertiary/25" />
                <span className="h-2 w-2 rounded-full bg-text-tertiary/20" />
              </div>
              <div className="relative aspect-[16/10]">
                <Image
                  src={SHOWCASE[0].src}
                  alt={SHOWCASE[0].alt}
                  fill
                  sizes="(max-width: 1024px) 88vw, 40vw"
                  className="object-cover object-top"
                  priority
                />
              </div>
            </motion.figure>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
