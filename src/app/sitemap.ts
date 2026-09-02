import type { MetadataRoute } from 'next';
import { getAllBlogPosts } from '@/lib/mdx';
import { getPostVisibilityMap, isVisible } from '@/lib/post-publications/visibility';

// Consulta post_publications (Supabase) para filtrar por visibilidad — eso
// solo puede resolverse en request time, no en build time (el CI de build
// no tiene, ni necesita, las credenciales de producción).
export const dynamic = 'force-dynamic';

const BASE_URL = 'https://silvanopuccini.dev';
const LOCALES = ['es', 'en'] as const;

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface StaticRoute {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/projects', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap(
    ({ path, changeFrequency, priority }) =>
      LOCALES.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            es: `${BASE_URL}/es${path}`,
            en: `${BASE_URL}/en${path}`,
          },
        },
      })),
  );

  const visibilityMap = await getPostVisibilityMap();
  const posts = getAllBlogPosts().filter((post) => isVisible(visibilityMap.get(post.slug)));

  const blogEntries: MetadataRoute.Sitemap = posts.flatMap((post) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as ChangeFrequency,
      priority: 0.7,
      alternates: {
        languages: {
          es: `${BASE_URL}/es/blog/${post.slug}`,
          en: `${BASE_URL}/en/blog/${post.slug}`,
        },
      },
    })),
  );

  return [...staticEntries, ...blogEntries];
}
