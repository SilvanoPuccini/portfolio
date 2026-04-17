import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getBlogPostBySlug } from "@/lib/mdx";
import { MDXContent } from "@/components/blog/MDXContent";
import { PostCover } from "@/components/blog/PostCover";
import { SubscribeForm } from "@/components/blog/SubscribeForm";
import { resolveLocale, type Locale } from "@/lib/i18n";

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

  const categoryColor =
    categoryColors[post.category] || "bg-blue-500/10 text-blue-400 border-blue-500/20";

  // Split: primer párrafo intro + resto. Si arranca con heading (#), no hay intro.
  const paragraphs = post.content.trim().split(/\n\n+/);
  const firstBlock = paragraphs[0].trim();
  const hasIntro = !firstBlock.startsWith("#");
  const firstParagraph = hasIntro ? firstBlock : null;
  const restContent = hasIntro
    ? paragraphs.slice(1).join("\n\n")
    : paragraphs.join("\n\n");

  return (
    <div className="site-container py-10 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl">

        {/* Navegación superior */}
        <nav className="mb-12">
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
          {/* Fila: categoría + reading time + fecha */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
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
            <time className="ml-auto font-mono text-[11px] text-text-tertiary">
              {formatDate(post.date)}
            </time>
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
          <PostCover title={post.title} category={post.category} variant="featured" />
        </div>

        {/* Resto del contenido MDX */}
        <MDXContent source={restContent} />

        {/* CTA Newsletter */}
        <section className="group relative mt-24 overflow-hidden rounded-sm border border-outline-ghost/10 bg-[rgb(var(--surface-elevated))] px-8 py-10 sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-primary/8 blur-[80px] transition-colors duration-700 group-hover:bg-brand-primary/12" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-secondary/8 blur-[60px]" />

          <div className="relative">
            <h3 className="text-2xl font-semibold text-text-primary sm:text-3xl">
              Suscríbete al Radar.
            </h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-text-secondary">
              Recibe semanalmente lo que estoy construyendo — artículos, recursos técnicos y reflexiones sobre el futuro del diseño digital. Sin spam, solo arquitectura.
            </p>
            <SubscribeForm />
          </div>
        </section>

        {/* Footer del post */}
        <footer className="mt-10 flex items-center justify-between border-t border-outline-ghost/15 pt-8">
          <Link
            href={`/${currentLocale}/blog`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-brand-primary"
          >
            <span aria-hidden>←</span>
            Volver al blog
          </Link>
          <span
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${categoryColor}`}
          >
            {post.category}
          </span>
        </footer>

      </div>
    </div>
  );
}
