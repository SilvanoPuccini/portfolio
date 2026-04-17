import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/mdx";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import { SubscribeForm } from "@/components/blog/SubscribeForm";
import { PostCover } from "@/components/blog/PostCover";
import { RadarBadge } from "@/components/blog/RadarBadge";
import Link from "next/link";
import { Linkedin, Instagram } from "lucide-react";

type LocaleParams = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);

  return {
    title: `${content.metadata.siteName} | Blog`,
    description: content.blog.intro,
  };
}

export default async function BlogPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const content = getSiteContent(currentLocale);
  const blogPosts = getAllBlogPosts();
  const featuredPost = blogPosts.find(post => post.featured) || blogPosts[0];
  const latestPosts = blogPosts.filter(post => post.slug !== featuredPost?.slug);

  // Colores por categoría
  const categoryColors: Record<string, string> = {
    'Performance': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Producto': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Automatización': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
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
        subtitle={<p>{content.blog.intro}</p>}
        description={
          <div className="space-y-6">
            <p>{content.blog.editorialNote}</p>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-tertiary">
                De la mano de
              </span>
              <RadarBadge />
            </div>
          </div>
        }
      />


      {/* Por qué armé este espacio */}
      <section className="site-container pb-10 sm:pb-12 lg:pb-16">
        <div className="mx-auto max-w-2xl border-l-2 border-brand-primary/30 pl-8">
          <p className="technical-label mb-5">Por qué armé este espacio</p>
          <div className="space-y-5 text-base leading-8 text-text-secondary sm:text-lg sm:leading-9">
            <p>
              No hay manera honesta de presentarme como desarrollador con solo un listado de tecnologías y screenshots de proyectos. Podés poner React, Next.js y Django en el CV y no decirle nada a nadie sobre cómo tomás decisiones cuando el producto está en producción y algo falla.
            </p>
            <p>
              Este espacio existe por eso. Para mostrar el razonamiento detrás del código — por qué una arquitectura y no otra, qué falló primero, qué aprendí en el camino. No tutoriales, no listas de tips: notas de alguien que construye cosas reales y elige ser transparente sobre el proceso.
            </p>
            <p className="text-text-tertiary text-sm leading-7">
              Si algo de lo que escribo te resulta útil, bienvenido. Si disentís, mejor todavía.
            </p>
          </div>
        </div>
      </section>

      {/* Artículo destacado */}
      {featuredPost && (
        <section className="site-container py-10 sm:py-12 lg:py-14">
          <p className="technical-label mb-8">Notas</p>

          <div className="grid gap-8 xl:grid-cols-2 xl:gap-12">
            {/* Cover */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm xl:aspect-auto xl:min-h-[320px]">
              <PostCover title={featuredPost.title} category={featuredPost.category} variant="featured" />
            </div>

            {/* Contenido del post */}
            <div className="flex flex-col justify-center">
              <span className={`inline-flex w-fit rounded-pill border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColors[featuredPost.category] || 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {featuredPost.category}
              </span>

              <h2 className="mt-5 text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-[2.2rem]">
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
                Leer artículo →
              </Link>
            </div>
          </div>
        </section>
      )}

      <CategoryFilter
        posts={latestPosts}
        currentLocale={currentLocale}
        eyebrow={content.blog.latestLabel}
      />

      {/* Continuar la conversación */}
      <section className="site-container pb-12 sm:pb-14 lg:pb-16">
        {/* Encabezado de sección */}
        <div className="mb-10 sm:mb-12">
          <p className="technical-label mb-4">Continuar la conversación</p>
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Criterio editorial para mentes técnicas.
          </h2>
        </div>

        {/* Grid 12 columnas: newsletter grande + dos cards apiladas */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">

          {/* Newsletter — col-span-6 */}
          <div className="surface-section relative flex flex-col justify-between overflow-hidden px-8 py-10 sm:px-10 sm:py-12 lg:col-span-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">El Radar</p>
              <h3 className="mt-5 text-3xl font-semibold text-text-primary sm:text-4xl">
                Suscríbete a El Radar.
              </h3>
              <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                Recibe semanalmente lo que estoy construyendo — artículos, recursos técnicos y reflexiones sobre el futuro del diseño digital. Sin spam, solo arquitectura.
              </p>
              <SubscribeForm />
            </div>
          </div>

          {/* Columna derecha: LinkedIn + Instagram apilados */}
          <div className="flex flex-col gap-6 lg:col-span-6">

            {/* LinkedIn */}
            <div className="surface-section relative flex flex-1 flex-col justify-between overflow-hidden px-8 py-9 sm:px-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-secondary/10 blur-3xl" />

              <div className="relative">
                <p className="technical-label">LinkedIn</p>
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  Perspectiva Profesional.
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Formatos visuales y reflexiones sobre el desarrollo de software y gestión de proyectos.
                </p>
              </div>

              <a
                href="https://www.linkedin.com/in/silvano-puccini/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary transition-colors hover:underline"
              >
                <Linkedin size={13} />
                Ver perfil
              </a>
            </div>

            {/* Instagram */}
            <div className="surface-section relative flex flex-1 flex-col justify-between overflow-hidden px-8 py-9 sm:px-10">
              <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-primary/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <p className="technical-label">Instagram</p>
                  <span className="rounded-full border border-outline-ghost/20 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-text-tertiary">
                    Próximamente
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-text-primary">
                  Proceso y Detrás de Escena.
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  Una mirada a la ejecución técnica y el día a día del desarrollo.
                </p>
              </div>

              <span className="relative mt-8 inline-flex cursor-not-allowed items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                <Instagram size={13} />
                Seguinos →
              </span>
            </div>

          </div>{/* fin columna derecha */}
        </div>{/* fin grid */}
      </section>
    </>
  );
}
