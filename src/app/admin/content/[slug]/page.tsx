import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { verifySessionToken } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { LinkedInEditor } from '@/components/admin/linkedin/LinkedInEditor';
import type { LinkedInPost } from '@/lib/linkedin-posts/types';

export default async function LinkedInDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get('admin_session')?.value;
  if (!secret || !token || !verifySessionToken(token, secret)) redirect('/admin');
  const { slug } = await params;
  const { data } = await getSupabaseAdmin().from('linkedin_posts').select('*').eq('slug', slug).is('deleted_at', null).maybeSingle<LinkedInPost>();
  if (!data) notFound();
  return <div style={{ maxWidth: 820, margin: '0 auto' }}><Link href="/admin/content" style={{ color: '#64748b', fontSize: 12 }}>← Biblioteca de LinkedIn</Link><h1 style={{ fontSize: 24, margin: '16px 0' }}>{data.title}</h1><LinkedInEditor item={data} /></div>;
}
