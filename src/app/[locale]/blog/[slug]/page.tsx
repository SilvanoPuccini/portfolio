import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/mdx";
import { MDXContent } from "@/components/blog/MDXContent";
import { PostCover } from "@/components/blog/PostCover";
import { SubscribeForm } from "@/components/blog/SubscribeForm";
import { resolveLocale, type Locale } from "@/lib/i18n";
import { RadarBadge } from "@/components/blog/RadarBadge";

type LocaleParams = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: LocaleParams;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: "Post no encontrado" };

  return {
    title: post.title,
    description: post.excerpt,
  };
}

const categoryColors: Record<string, string> = {
  Performance: "bg-green-500/10 text-green-400 border-green-500/20",
  Producto: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Automatización: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: LocaleParams;
}) {
  const { slug, locale } = await params;
  const currentLocale: Locale = resolveLocale(locale);
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const allPosts = getAllBlogPosts().sort((a, b) => a.issue - b.issue);
  const totalPosts = allPosts.length;
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < totalPosts - 1 ? allPosts[currentIndex + 1] : null;

  const categoryColor =
    categoryColors[post.category] || "bg-blue-500/10 text-blue-400 border-blue-500/20";

  // Split en el primer ## heading: todo lo anterior es intro, todo lo posterior es contenido.
  const rawContent = post.content.trim();
  const h2Match = rawContent.match(/\n## /);
  const splitIndex = h2Match?.index;
  const hasIntro = splitIndex !== undefined && splitIndex > 0;
  const firstParagraph = hasIntro ? rawContent.slice(0, splitIndex).trim() : null;
  const restContent = hasIntro ? rawContent.slice(splitIndex + 1) : rawContent;

  return (
    <div className="site-container py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">

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

        {/* Header editorial */}
        <header className="mb-12 sm:mb-16">
          {/* Fila: categoría + reading time | RadarBadge | fecha */}
          <div className="mb-6 grid grid-cols-3 items-center gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColor}`}
              >
                {post.category}
              </span>
              {post.readingTime && (
                <span className="font-mono text-[11px] text-text-tertiary">
                  {post.readingTime}
                </span>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <RadarBadge />
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-text-tertiary/60">
                Nº {String(post.issue).padStart(2, "0")}
              </span>
            </div>
            <div className="flex justify-end">
              <time className="font-mono text-[11px] text-text-tertiary">
                {formatDate(post.date)}
              </time>
            </div>
          </div>

          {/* Título grande */}
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            {post.title}
          </h1>

          {/* Separador + autor */}
          <div className="mt-8 flex items-center gap-4 border-t border-outline-ghost/15 pt-6">
            <Image
              src="/avatar.png"
              alt="Silvano Puccini"
              width={44}
              height={44}
              className="rounded-full object-cover grayscale"
            />
            <div>
              <p className="text-sm font-medium text-text-primary">
                Silvano Puccini
              </p>
              <p className="font-mono text-[11px] text-text-tertiary">
                Full Stack Engineer
              </p>
            </div>
          </div>
        </header>

        {/* Párrafo intro — solo si existe y no es un heading */}
        {firstParagraph && <MDXContent source={firstParagraph} />}

        {/* Cover */}
        <div className="my-12 h-[260px] overflow-hidden rounded-sm sm:h-[320px] lg:h-[380px]">
          <PostCover title={post.title} category={post.category} variant="featured" showRadar={slug === "manifesto-editorial"} />
        </div>

        {/* Resto del contenido MDX */}
        <MDXContent source={restContent} />

        {/* Cierre — logo El Radar centrado */}
        <div className="mt-20 flex justify-center">
          <RadarBadge />
        </div>

        {/* CTA Newsletter */}
        <section className="group relative mt-12 overflow-hidden rounded-sm border border-outline-ghost/10 bg-[rgb(var(--surface-elevated))] px-8 py-10 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/8 blur-[80px] transition-colors duration-700 group-hover:bg-brand-primary/12" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-secondary/8 blur-[60px]" />

          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-brand-primary mb-3">Newsletter</p>
            <h3 className="text-2xl font-semibold text-text-primary sm:text-3xl">
              ¡No te pierdas! Mantenete cerca del radar.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-text-secondary">
              Recibí semanalmente lo que estoy construyendo — artículos, recursos técnicos y reflexiones sobre el futuro del diseño digital. Sin spam, solo arquitectura.
            </p>
            <SubscribeForm />
          </div>
        </section>

        {/* Footer del post — navegación editorial */}
        <footer className="mt-10 border-t border-outline-ghost/15 pt-8">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Izquierda: anterior o volver al blog */}
            <div>
              {prevPost ? (
                <Link
                  href={`/${currentLocale}/blog/${prevPost.slug}`}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
                >
                  <span aria-hidden>←</span>
                  El Radar Nº {String(prevPost.issue).padStart(2, "0")}
                </Link>
              ) : (
                <Link
                  href={`/${currentLocale}/blog`}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
                >
                  <span aria-hidden>←</span>
                  Volver al blog
                </Link>
              )}
            </div>

            {/* Centro: contador */}
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-tertiary/50">
                El Radar
              </span>
              <span className="font-mono text-[13px] font-semibold tracking-[0.1em] text-text-primary">
                Nº {String(post.issue).padStart(2, "0")}
              </span>
              <span className="font-mono text-[10px] text-text-tertiary/50">
                de {String(totalPosts).padStart(2, "0")}
              </span>
            </div>

            {/* Derecha: siguiente */}
            <div className="flex justify-end">
              {nextPost ? (
                <Link
                  href={`/${currentLocale}/blog/${nextPost.slug}`}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
                >
                  El Radar Nº {String(nextPost.issue).padStart(2, "0")}
                  <span aria-hidden>→</span>
                </Link>
              ) : (
                <Link
                  href={`/${currentLocale}/blog`}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
                >
                  Ver todas las notas
                  <span aria-hidden>→</span>
                </Link>
              )}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
