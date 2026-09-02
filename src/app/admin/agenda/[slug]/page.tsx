import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug } from '@/lib/mdx';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/admin-auth';
import { MDXContent } from '@/components/blog/MDXContent';
import { PostCover } from '@/components/blog/PostCover';
import { STATUS_LABELS } from '@/components/admin/agenda/StatusBadge';
import type { PostPublication } from '@/lib/post-publications/types';

async function requireAdminSession() {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get('admin_session')?.value;
  const authorized = Boolean(sessionSecret && token && verifySessionToken(token, sessionSecret));
  if (!authorized) redirect('/admin');
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AgendaPostPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSession();
  const { slug } = await params;

  const db = getSupabaseAdmin();
  const { data: agendaItem } = await db
    .from('post_publications')
    .select('*')
    .eq('post_slug', slug)
    .single<PostPublication>();

  const post = await getBlogPostBySlug(slug);

  if (!agendaItem && !post) notFound();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link
        href="/admin/agenda"
        style={{ fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.6 }}
      >
        ← Agenda
      </Link>

      <div
        style={{
          marginTop: 16,
          marginBottom: 24,
          padding: 16,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>{agendaItem?.raw_title ?? post?.title ?? slug}</span>
          {agendaItem && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 20,
                fontFamily: 'monospace',
                background: 'rgba(0,212,212,0.1)',
                color: '#00d4d4',
              }}
            >
              {STATUS_LABELS[agendaItem.status]}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.5 }}>{slug}</div>

        {agendaItem && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            <span>Programado: {fmt(agendaItem.scheduled_at)}</span>
            <span>Preaprobado: {fmt(agendaItem.pre_approved_at)}</span>
            <span>Publicado: {fmt(agendaItem.published_at)}</span>
            <span>Newsletter enviado: {fmt(agendaItem.notified_at)}</span>
          </div>
        )}

        {!post && (
          <p style={{ fontSize: 13, color: '#f87171', marginTop: 8 }}>
            Todavía no existe el archivo .mdx de este post — solo hay texto en bruto en la agenda,
            falta hardcodearlo.
          </p>
        )}
      </div>

      {post && (
        <div style={{ background: '#0a0a14', borderRadius: 12, padding: '32px 40px', color: '#e2e8f0' }}>
          <div className="mb-8 h-[220px] overflow-hidden rounded-sm">
            <PostCover title={post.title} category={post.category} variant="featured" keyword={post.keyword} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 600, marginBottom: 24 }}>{post.title}</h1>
          <MDXContent source={post.content} />
        </div>
      )}
    </div>
  );
}
