import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getAllBlogPosts } from '@/lib/mdx';
import { buildEmail, formatDate } from '@/lib/newsletter/send-post-newsletter';
import { generateUnsubToken } from '@/lib/unsub-token';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.DISTRIBUTION_BASE_URL ?? 'https://silvanopuccini.dev';
// Email ficticio solo para que el link de baja del preview sea realista.
const PREVIEW_EMAIL = 'preview@silvanopuccini.dev';

/**
 * Devuelve el HTML exacto que se enviaría para un slug, para previsualizarlo
 * en el admin. Usa la misma plantilla del envío real: lo que se ve acá es
 * lo que sale por mail.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slug = new URL(req.url).searchParams.get('slug');
  const post = getAllBlogPosts().find((p) => p.slug === slug);

  if (!post) {
    return NextResponse.json({ error: 'Post no encontrado.' }, { status: 404 });
  }

  const issueNum = String(post.issue).padStart(2, '0');
  const { token, exp } = generateUnsubToken(PREVIEW_EMAIL);

  const html = buildEmail({
    title: post.title,
    excerpt: post.excerpt ?? '',
    category: post.category,
    issue: issueNum,
    readingTime: post.readingTime ?? '5 min',
    date: formatDate(post.date),
    postUrl: `${SITE_URL}/es/blog/${post.slug}`,
    unsubUrl: `${SITE_URL}/unsubscribe?email=${encodeURIComponent(PREVIEW_EMAIL)}&token=${token}&exp=${exp}`,
    keyword: post.keyword ?? post.category,
  });

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
