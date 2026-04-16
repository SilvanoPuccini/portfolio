import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/mdx";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import Link from "next/link";

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
          <p>{content.blog.editorialNote}</p>
        }
      />


      {/* Artículo destacado */}
      {featuredPost && (
        <section className="site-container pb-10 sm:pb-12 lg:pb-14">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              Destacado
            </span>
            <span className="h-px w-8 bg-outline-ghost/30" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
              1 post featured · rotación semanal
            </span>
          </div>

          <div className="grid gap-8 xl:grid-cols-2 xl:gap-12">
            {/* Cover image placeholder */}
            <div className="surface-section bg-editorial-texture relative aspect-[4/3] overflow-hidden xl:aspect-auto xl:h-full">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_50%,rgba(138,235,255,0.28),transparent_24%),radial-gradient(circle_at_65%_58%,rgba(5,102,217,0.16),transparent_30%),linear-gradient(135deg,rgba(6,10,18,0.65),rgba(6,10,18,0.1))]" />
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-6xl opacity-20">📄</div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Cover</p>
                </div>
              </div>
            </div>

            {/* Contenido del post */}
            <div className="flex flex-col justify-center">
              <span className={`inline-flex w-fit rounded-pill border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColors[featuredPost.category] || 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                {featuredPost.category}
              </span>

              <h2 className="mt-5 text-3xl font-semibold leading-tight text-text-primary sm:text-4xl lg:text-[2.2rem]">
                {featuredPost.title}
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

      {/* Newsletter y LinkedIn */}
      <section className="site-container pb-12 sm:pb-14 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Newsletter */}
          <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">Newsletter</p>
              <h2 className="mt-4 text-3xl font-semibold text-text-primary sm:text-4xl">
                Suscribite al radar
              </h2>
              <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                1–2 posts por semana. Sin ruido — solo lo que construí y aprendí.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-3">
                  <input 
                    type="email" 
                    placeholder="tu@email.com"
                    className="flex-1 rounded-xl bg-surface-elevated/90 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                  <button className="button-primary rounded-xl px-6 py-3 text-xs uppercase tracking-[0.2em]">
                    Suscribirme
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">LinkedIn</p>
              <h2 className="mt-4 text-3xl font-semibold text-text-primary sm:text-4xl">
                Contenido en carruseles
              </h2>
              <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                Cada artículo se publica también como carrusel en LinkedIn — misma idea, formato deslizable.
              </p>

              <a 
                href="https://www.linkedin.com/in/silvano-puccini/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
              >
                Ver perfil →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
