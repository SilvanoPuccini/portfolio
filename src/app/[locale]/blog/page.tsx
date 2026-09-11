import Reveal from "@/components/site/Reveal";
import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/metadata";
import { getAllBlogPosts } from "@/lib/mdx";
import { getVisibilityIndex, isPostVisible, getNextScheduledPost } from "@/lib/post-publications/visibility";
import { NextIssueTeaser } from "@/components/blog/NextIssueTeaser";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import { SubscribeForm } from "@/components/blog/SubscribeForm";
import { PostCover } from "@/components/blog/PostCover";
import Image from "next/image";
import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";

/**
 * El logo de X. lucide todavía expone `Twitter`, que es el pájaro viejo.
 * La marca es una forma sólida, no dos trazos cruzados: va como `path` relleno
 * y por eso ignora el `strokeWidth` que sí usan los íconos de lucide.
 */
function XLogo({ size = 24 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 640 640"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M453.2 112L523.8 112L369.6 288.2L551 528L409 528L297.7 382.6L170.5 528L99.8 528L264.7 339.5L90.8 112L236.4 112L336.9 244.9L453.2 112zM428.4 485.8L467.5 485.8L215.1 152L173.1 152L428.4 485.8z" />
    </svg>
  );
}

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);

  return generatePageMetadata({
    locale: currentLocale,
    path: "blog",
    title: `${content.metadata.siteName} | Blog`,
    description: content.blog.intro,
  });
}

export default async function BlogPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const visibility = await getVisibilityIndex();
  const blogPosts = getAllBlogPosts().filter((post) => isPostVisible(post, visibility));
  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0];
  const nextIssue = await getNextScheduledPost();

  const pageCopy = {
    es: {
      newsletterLabel: "Mi Newsletter",
      featuredEyebrow: "Notas",
      readArticle: "Leer artículo →",
      continueTitle: "Continuar la conversación",
      continueHeading: "Criterio editorial para mentes técnicas.",
      subscribeHeading: "Suscríbete a El Radar.",
      subscribeBody: "Recibe semanalmente lo que estoy construyendo: artículos, recursos técnicos y reflexiones sobre el futuro del diseño digital. Sin spam, solo arquitectura.",
      linkedinHeading: "Perspectiva Profesional.",
      linkedinBody: "Formatos visuales y reflexiones sobre el desarrollo de software y gestión de proyectos.",
      linkedinCta: "Ver perfil",
      instagramHeading: "Proceso y Detrás de Escena.",
      instagramBody: "Una mirada a la ejecución técnica y el día a día del desarrollo.",
      instagramCta: "Seguinos →",
      xHeading: "Hilos y criterio en corto.",
      xBody: "Cada nota del blog se convierte en un hilo: la idea, el ejemplo y el costo.",
      xCta: "Seguime en X →",
      socialLabel: "Donde también estoy",
      comingSoon: "Próximamente",
      months: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    },
    en: {
      newsletterLabel: "My Newsletter",
      featuredEyebrow: "Notes",
      readArticle: "Read article →",
      continueTitle: "Continue the conversation",
      continueHeading: "Editorial thinking for technical minds.",
      subscribeHeading: "Subscribe to El Radar.",
      subscribeBody: "Receive weekly what I'm building: articles, technical resources, and reflections on the future of digital design. No spam, just architecture.",
      linkedinHeading: "Professional Perspective.",
      linkedinBody: "Visual formats and reflections on software development and project management.",
      linkedinCta: "View profile",
      instagramHeading: "Process and Behind the Scenes.",
      instagramBody: "A look at technical execution and the day-to-day of development.",
      xHeading: "Threads and criteria, short form.",
      xBody: "Every blog note becomes a thread: the idea, the example and the cost.",
      xCta: "Follow me on X →",
      socialLabel: "Where else I am",
      instagramCta: "Follow →",
      comingSoon: "Coming soon",
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    },
  } as const;
  const pc = pageCopy[currentLocale];

  /**
   * Las redes, en un solo lugar. Instagram todavía no está activo pero la
   * cuenta va a existir: se deja la fila armada para no volver a tocar el
   * bloque cuando llegue.
   */
  const SOCIALS = [
    {
      key: "linkedin",
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/silvano-puccini/",
      Icon: Linkedin,
      heading: pc.linkedinHeading,
      cta: pc.linkedinCta,
    },
    {
      key: "x",
      name: "X",
      href: "https://x.com/silvanopuccini",
      Icon: XLogo,
      heading: pc.xHeading,
      cta: pc.xCta,
    },
    {
      key: "instagram",
      name: "Instagram",
      href: "https://www.instagram.com/silvanopuccini.dev/",
      Icon: Instagram,
      heading: pc.instagramHeading,
      cta: pc.instagramCta,
    },
  ];

  // Colores por categoría
  const categoryColors: Record<string, string> = {
    'Performance':    'bg-green-500/10 text-green-400 border-green-500/20',
    'Producto':       'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Automatización': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Criterio':       'bg-sky-500/10 text-sky-400 border-sky-500/20',
    'Editorial':      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };

  // Format date with locale-aware output
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const localeCode = currentLocale === "es" ? "es-AR" : "en-US";
    return date.toLocaleDateString(localeCode, { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <>
      <PageHero
        eyebrow={content.blog.eyebrow}
        title={
          <>
            {content.blog.title} {content.blog.titleAccent}
          </>
        }
        bodyClassName="space-y-7 sm:space-y-8"
        /*
          El hero reserva un alto mínimo en pantallas grandes para no quedar
          chato cuando el texto es corto. Acá abajo va el banner, así que ese
          alto sobra: sin desactivarlo queda un hueco muerto entre la
          descripción y la imagen.
        */
        layoutClassName="lg:min-h-0 xl:min-h-0"
        subtitle={<p>{content.blog.intro}</p>}
        description={
          <div className="space-y-6">
            {/*
              La línea única recién entra a partir de `lg`. En `sm` forzaba un
              ancho que no cabía en la tablet y cortaba el texto por la derecha.
            */}
            <p className="lg:whitespace-nowrap">{content.blog.editorialNote}</p>
          </div>
        }
        /*
          El banner va en `below` y no dentro de la descripción: ahí quedaba
          encajonado en la columna de texto y no llegaba ni a la mitad del
          ancho. Y va dentro del hero, no como sección aparte, para que el
          fondo del hero lo cubra entero en vez de cortarse a la mitad de la
          foto; abajo queda el respiro de ~1cm que usan las demás páginas.

          No lleva margen negativo. Lo llevaba para recuperar el hueco que
          dejaba el alto mínimo del hero, pero eso ataba la posición del
          banner a cuántas líneas ocupara el texto: en el celular la
          descripción crece a tres líneas y la imagen se comía la última. El
          alto mínimo se desactiva arriba y el banner queda con flujo normal.

          Usa la proporción nativa de la imagen (2172x724) en vez de un alto
          fijo, así no se recorta a los costados. El clip inferior de 2px solo
          oculta la línea blanca incluida en el borde del asset.
        */
        below={
          <div className="site-container pb-10 sm:pb-12">
            <div className="relative aspect-[2172/724] w-full overflow-hidden rounded-sm [clip-path:inset(0_0_2px_0)]">
              <Image
                src="/images/blog-elradar-hero.png"
                alt="El Radar — el newsletter de Silvano Puccini"
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        }
      />


      {/* Artículo destacado */}
      {featuredPost && (
        <section className="site-container py-10 sm:py-12 lg:py-14">
          <p className="technical-label mb-8">{pc.featuredEyebrow}</p>

          <div className="grid gap-8 xl:grid-cols-2 xl:gap-12">
            {/* Cover */}
            <Link
              href={`/${currentLocale}/blog/${featuredPost.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-sm xl:aspect-auto xl:min-h-[320px]"
            >
              <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-105">
                <PostCover title={featuredPost.title} category={featuredPost.category} variant="featured" keyword={featuredPost.keyword} />
              </div>
            </Link>

            {/* Contenido del post */}
            <div className="flex flex-col justify-center">
              <span className={`inline-flex w-fit rounded-pill border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColors[featuredPost.category] || 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {featuredPost.category}
              </span>

              <h2 className="mt-5 section-title">
                <Link
                  href={`/${currentLocale}/blog/${featuredPost.slug}`}
                  className="hover:underline hover:text-brand-primary transition-colors duration-150"
                >
                  {featuredPost.title}
                </Link>
              </h2>

              <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {featuredPost.excerpt}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {featuredPost.readingTime}
                </span>
                <span className="h-1 w-1 rounded-full bg-outline-ghost/30" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {formatDate(featuredPost.date)}
                </span>
              </div>

              <Link 
                href={`/${currentLocale}/blog/${featuredPost.slug}`}
                className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
              >
                {pc.readArticle}
              </Link>
            </div>
          </div>
        </section>
      )}

      {nextIssue && (
        <section className="site-container pb-6 sm:pb-8">
          <NextIssueTeaser post={nextIssue} locale={currentLocale} />
        </section>
      )}

      <CategoryFilter
        posts={blogPosts}
        featuredSlug={featuredPost?.slug}
        currentLocale={currentLocale}
        eyebrow={content.blog.latestLabel}
      />

      {/* Continuar la conversación */}
      <section className="site-container pb-12 sm:pb-14 lg:pb-16">
        {/* Encabezado de sección */}
        <div className="mb-10 sm:mb-12">
          <p className="technical-label mb-4">{pc.continueTitle}</p>
          <h2 className="section-title">
            {pc.continueHeading}
          </h2>
        </div>

        {/* Grid 12 columnas: newsletter grande + dos cards apiladas */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">

          {/* Newsletter — col-span-6 */}
          <Reveal className="lg:col-span-6">
          <div className="surface-section relative flex h-full flex-col justify-between overflow-hidden px-8 py-10 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">El Radar</p>
              <h3 className="mt-5 section-title">
                {pc.subscribeHeading}
              </h3>
              <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {pc.subscribeBody}
              </p>
              <SubscribeForm />
            </div>
          </div>
          </Reveal>

          {/*
            Columna derecha: las tres redes.

            Antes eran dos tarjetas altas con un ícono de 13 px, así que el
            contenedor pesaba más que la marca que tenía que identificar. Se
            invierte: tarjeta compacta, logo grande y el enlace en texto normal.
            Entran las tres en el alto que antes ocupaban dos.
          */}
          <div className="flex flex-col gap-4 lg:col-span-6">
            <p className="technical-label">{pc.socialLabel}</p>

            {SOCIALS.map(({ key, name, href, Icon, heading, cta }) => (
              <Reveal key={key} className="flex">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-section group relative flex w-full items-center gap-5 overflow-hidden px-6 py-5 transition-colors hover:border-brand-primary/40 sm:px-7"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-primary/10 blur-3xl" />

                  {/* El logo manda: es lo que se reconoce sin leer. */}
                  <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-outline-ghost/15 bg-surface-elevated/60 text-text-primary transition-colors group-hover:text-brand-primary">
                    <Icon size={30} strokeWidth={1.6} />
                  </span>

                  <span className="relative min-w-0 flex-1">
                    <span className="block text-base font-semibold text-text-primary">{name}</span>
                    <span className="mt-0.5 block truncate text-sm leading-6 text-text-secondary">{heading}</span>
                    <span className="mt-1 block text-sm text-brand-primary group-hover:underline">{cta}</span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>{/* fin columna derecha */}
        </div>{/* fin grid */}
      </section>
    </>
  );
}
