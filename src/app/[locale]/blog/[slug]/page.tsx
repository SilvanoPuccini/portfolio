import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug } from '@/lib/mdx';
import { MDXContent } from '@/components/blog/MDXContent';
import { resolveLocale, type Locale } from '@/lib/i18n';

type LocaleParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post no encontrado',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { slug, locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Colores por categoría
  const categoryColors: Record<string, string> = {
    'Performance': 'bg-green-500/10 text-green-400',
    'Producto': 'bg-purple-500/10 text-purple-400',
    'Automatización': 'bg-amber-500/10 text-amber-400',
  };

  const categoryColor = categoryColors[post.category] || 'bg-blue-500/10 text-blue-400';

  return (
    <article className="site-container py-10 sm:py-12 lg:py-14">
      <div className="max-w-3xl mx-auto">

        {/* Navegación superior */}
        <nav className="mb-10">
          <Link
            href={`/${currentLocale}/blog`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
          >
            <span aria-hidden>←</span>
            Blog
          </Link>
        </nav>

        {/* Header del post */}
        <header className="mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className={`rounded-pill px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColor}`}>
              {post.category}
            </span>
            {post.readingTime && (
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                {post.readingTime}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-semibold text-text-primary sm:text-5xl leading-[1.05]">
            {post.title}
          </h1>
          
          <time className="mt-4 block font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
            {post.date}
          </time>
        </header>

        {/* Contenido del post */}
        <MDXContent source={post.content} />

        {/* Navegación inferior */}
        <footer className="mt-16 flex items-center justify-between border-t border-outline-ghost/15 pt-8">
          <Link
            href={`/${currentLocale}/blog`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
          >
            <span aria-hidden>←</span>
            Volver al blog
          </Link>
          <span className={`rounded-pill px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColor}`}>
            {post.category}
          </span>
        </footer>

      </div>
    </article>
  );
}