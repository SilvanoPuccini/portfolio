import type { Metadata } from "next";
import BlogGrid from "@/components/blocks/BlogGrid";
import EmptyStateEditorial from "@/components/blocks/EmptyStateEditorial";
import CTACluster from "@/components/site/CTACluster";
import PageHero from "@/components/site/PageHero";
import SectionShell from "@/components/site/SectionShell";
import { getFeaturedBlogPost, getLatestBlogPosts, getSiteContent } from "@/content/site";
import { resolveLocale, type Locale } from "@/lib/i18n";

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
  const featuredPost = getFeaturedBlogPost(currentLocale);
  const latestPosts = getLatestBlogPosts(currentLocale);

  return (
    <>
      <PageHero
        eyebrow={content.blog.eyebrow}
        title={
          <>
            {content.blog.title} <span className="text-brand-primary">{content.blog.titleAccent}</span>
          </>
        }
        subtitle={<p>{content.blog.intro}</p>}
        description={<p>{content.blog.editorialNote}</p>}
        aside={
          <div className="surface-panel no-line-stack px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
            <div>
              <p className="technical-label">Status</p>
              <p className="mt-3 text-lg font-semibold text-text-primary">
                {currentLocale === "es" ? "Blog activo en navegación" : "Blog live in navigation"}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{content.blog.editorialNote}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {content.blog.featuredLabel}
                </p>
                <p className="mt-2 text-base font-semibold text-text-primary">{featuredPost?.title ?? "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                  {content.blog.latestLabel}
                </p>
                <p className="mt-2 text-base font-semibold text-text-primary">{content.blog.posts.length} posts</p>
              </div>
            </div>
          </div>
        }
      />

      {featuredPost ? (
        <section className="site-container pb-10 sm:pb-12 lg:pb-14">
          <div className="grid items-center gap-8 xl:grid-cols-12 xl:gap-10">
            <div className="surface-section bg-editorial-texture relative overflow-hidden px-0 py-0 xl:col-span-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_34%_50%,rgba(138,235,255,0.28),transparent_24%),radial-gradient(circle_at_65%_58%,rgba(5,102,217,0.16),transparent_30%),linear-gradient(135deg,rgba(6,10,18,0.65),rgba(6,10,18,0.1))]" />
              <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative flex aspect-[16/10] items-end p-8 sm:p-10">
                <div className="max-w-[16rem]">
                  <p className="technical-label">{featuredPost.category}</p>
                  <p className="mt-4 font-display text-5xl uppercase tracking-[-0.05em] text-white/18 sm:text-6xl">
                    Digital Systems
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-5">
              <div className="no-line-stack">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="technical-label">{featuredPost.category}</span>
                  <span className="h-px w-14 bg-outline-ghost/20" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">
                    {featuredPost.publishedAt}
                  </span>
                </div>

                <div>
                  <p className="rounded-pill border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-primary inline-flex">
                    {featuredPost.temporaryLabel}
                  </p>
                  <h2 className="mt-5 max-w-xl text-4xl leading-tight text-text-primary sm:text-5xl">
                    {featuredPost.title}
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-8 text-text-secondary sm:text-lg">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="space-y-3">
                  {featuredPost.body.slice(0, 2).map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-text-secondary sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <CTACluster
                  items={[
                    {
                      label: currentLocale === "es" ? "Leer dirección editorial" : "Read editorial direction",
                      href: `/${currentLocale}/contact`,
                    },
                    {
                      label: currentLocale === "es" ? "Proponer tema" : "Suggest a topic",
                      href: `mailto:${content.metadata.email}?subject=${encodeURIComponent(
                        currentLocale === "es" ? "Tema para el blog" : "Blog topic suggestion",
                      )}`,
                      external: true,
                      variant: "secondary",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <SectionShell
        eyebrow={content.blog.latestLabel}
        title={currentLocale === "es" ? "Grilla editorial lista para crecer" : "Editorial grid ready to grow"}
        description={<p>{content.blog.editorialNote}</p>}
      >
        {latestPosts.length > 0 ? (
          <BlogGrid
            posts={latestPosts}
            readMoreLabel={currentLocale === "es" ? "Leer más" : "Read more"}
            exploreLabel={currentLocale === "es" ? "Explorar estudio técnico" : "Explore technical study"}
          />
        ) : (
          <EmptyStateEditorial message={content.blog.emptyState} note={content.blog.editorialNote} />
        )}
      </SectionShell>

      <section className="site-container pb-12 sm:pb-14 lg:pb-16">
        <div className="surface-section relative overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-secondary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,32rem)] xl:items-center xl:gap-12">
            <div className="no-line-stack max-w-2xl">
              <p className="technical-label">Newsletter CTA</p>
              <h2 className="text-3xl text-text-primary sm:text-4xl">{content.blog.newsletter.title}</h2>
              <p className="text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {content.blog.newsletter.intro}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-xl bg-surface-elevated/90 px-6 py-4 text-sm text-text-tertiary">
                  {content.blog.newsletter.inputPlaceholder}
                </div>
                <a
                  href={`mailto:${content.metadata.email}?subject=${encodeURIComponent(
                    currentLocale === "es" ? "Suscripción al radar" : "Radar subscription",
                  )}`}
                  className="button-primary rounded-xl px-6 py-4 text-xs uppercase tracking-[0.2em]"
                >
                  {content.blog.newsletter.ctaLabel}
                </a>
              </div>
              <p className="text-sm leading-6 text-text-secondary">{content.blog.newsletter.helper}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
