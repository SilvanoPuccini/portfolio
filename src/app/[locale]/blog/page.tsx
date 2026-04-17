import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/mdx";
import { CategoryFilter } from "@/components/blog/CategoryFilter";
import { SubscribeForm } from "@/components/blog/SubscribeForm";
import { PostCover } from "@/components/blog/PostCover";
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

      {/* Newsletter, LinkedIn e Instagram */}
      <section className="site-container pb-12 sm:pb-14 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Newsletter */}
          <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">Newsletter</p>
              <h2 className="mt-4 text-2xl font-semibold text-text-primary sm:text-3xl">
                Lo que construí, en tu bandeja.
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                Sin ruido. Cada post llega directo — arquitectura, criterio y código real.
              </p>

              <SubscribeForm />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">LinkedIn</p>
              <h2 className="mt-4 text-2xl font-semibold text-text-primary sm:text-3xl">
                El blog, en carrusel.
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                Cada artículo llega a LinkedIn como carrusel visual. Misma idea, formato deslizable.
              </p>

              <a
                href="https://www.linkedin.com/in/silvano-puccini/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-brand-primary hover:underline"
              >
                <Linkedin size={13} />
                Ver perfil →
              </a>
            </div>
          </div>

          {/* Instagram */}
          <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

            <div className="relative">
              <p className="technical-label">Instagram</p>
              <h2 className="mt-4 text-2xl font-semibold text-text-primary sm:text-3xl">
                Próximamente.
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                El blog llega también a Instagram. Seguinos para ser el primero en verlo cuando publiquemos.
              </p>

              <a
                href="https://www.instagram.com/silvanopuccini/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary hover:text-brand-primary transition-colors"
              >
                <Instagram size={13} />
                Seguinos →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
