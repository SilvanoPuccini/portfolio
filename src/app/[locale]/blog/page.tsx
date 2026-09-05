import Reveal, { STAGGER } from "@/components/site/Reveal";
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
import { RadarBadge } from "@/components/blog/RadarBadge";
import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";

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
      instagramCta: "Follow →",
      comingSoon: "Coming soon",
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    },
  } as const;
  const pc = pageCopy[currentLocale];

  // Colores por categoría
  const categoryColors: Record<string, string> = {
    'Performance':    'bg-green-500/10 text-green-400 border-green-500/20',
    'Producto':       'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Automatización': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Criterio':       'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
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
        containerClassName="pb-32 sm:pb-36 lg:pb-36"
        subtitle={<p>{content.blog.intro}</p>}
        description={
          <div className="space-y-6">
            <p>{content.blog.editorialNote}</p>
            <div className="!mt-10 flex flex-col items-center gap-3 text-center sm:!mt-16 sm:inline-flex sm:flex-row sm:items-center sm:gap-10 sm:text-left">
              <span className="font-mono text-[12px] uppercase tracking-[0.22em] text-text-secondary">
                {pc.newsletterLabel}
              </span>
              <RadarBadge />
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
          <Reveal>
          <div className="surface-section relative flex flex-col justify-between overflow-hidden px-8 py-10 sm:px-10 sm:py-12 lg:col-span-6">
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

          {/* Columna derecha: LinkedIn + Instagram apilados */}
          <div className="flex flex-col gap-6 lg:col-span-6">

            {/* LinkedIn */}
            <Reveal delay={STAGGER * 1}>
            <div className="surface-section relative flex flex-1 flex-col justify-between overflow-hidden px-8 py-9 sm:px-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-secondary/10 blur-3xl" />

              <div className="relative">
                <p className="technical-label">LinkedIn</p>
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  {pc.linkedinHeading}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {pc.linkedinBody}
                </p>
              </div>

              <a
                href="https://www.linkedin.com/in/silvano-puccini/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary transition-colors hover:underline"
              >
                <Linkedin size={13} />
                {pc.linkedinCta}
              </a>
            </div>
            </Reveal>

            {/* Instagram */}
            <Reveal delay={STAGGER * 2}>
            <div className="surface-section relative flex flex-1 flex-col justify-between overflow-hidden px-8 py-9 sm:px-10">
              <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />

              <div className="relative">
                <p className="technical-label">Instagram</p>
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  {pc.instagramHeading}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {pc.instagramBody}
                </p>
              </div>

              <a
                href="https://www.instagram.com/silvanopuccini.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary transition-colors hover:underline"
              >
                <Instagram size={13} />
                {pc.instagramCta}
              </a>
            </div>
            </Reveal>

          </div>{/* fin columna derecha */}
        </div>{/* fin grid */}
      </section>
    </>
  );
}
