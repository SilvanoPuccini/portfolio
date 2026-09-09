import { getBlogPostBySlug } from '@/lib/blog';
import { getSupabaseAdmin } from '@/lib/supabase';

export type DistributionSourceChannel = 'portfolio' | 'linkedin';
export type DistributionSourceRef = { channel: DistributionSourceChannel; id: string };

export interface DistributionSource {
  storageKey: string;
  title: string;
  content: string;
  url: string;
}

export function encodeDistributionSource(ref: DistributionSourceRef): string {
  return ref.channel === 'portfolio' ? ref.id : `linkedin:${ref.id}`;
}

export async function resolveDistributionSource(ref: DistributionSourceRef | string): Promise<DistributionSource | null> {
  const normalized = typeof ref === 'string'
    ? (ref.startsWith('linkedin:') ? { channel: 'linkedin' as const, id: ref.slice(9) } : { channel: 'portfolio' as const, id: ref })
    : ref;
  const db = getSupabaseAdmin();

  if (normalized.channel === 'linkedin') {
    const { data } = await db.from('linkedin_posts').select('slug, title, body')
      .eq('slug', normalized.id).is('deleted_at', null).maybeSingle();
    if (!data?.body?.trim()) return null;
    return { storageKey: `linkedin:${data.slug}`, title: data.title, content: data.body, url: '' };
  }

  const { data: stored } = await db.from('post_publications').select('post_slug, raw_title, raw_content')
    .eq('post_slug', normalized.id).is('deleted_at', null).maybeSingle();
  const staticPost = getBlogPostBySlug(normalized.id);
  const content = stored?.raw_content?.trim() || staticPost?.content;
  if (!content) return null;
  return {
    storageKey: normalized.id,
    title: stored?.raw_title || staticPost?.title || normalized.id,
    content,
    url: `https://silvanopuccini.dev/es/blog/${normalized.id}`,
  };
}
