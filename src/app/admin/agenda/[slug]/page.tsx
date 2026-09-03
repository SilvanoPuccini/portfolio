import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getBlogPostBySlug } from '@/lib/mdx';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifySessionToken } from '@/lib/admin-auth';
import { previewUrl } from '@/lib/post-publications/preview';
import { STATUS_LABELS, STATUS_COLORS } from '@/components/admin/agenda/StatusBadge';
import type { PostPublication } from '@/lib/post-publications/types';

async function requireAdminSession() {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const token = (await cookies()).get('admin_session')?.value;
  const authorized = Boolean(sessionSecret && token && verifySessionToken(token, sessionSecret));
  if (!authorized) redirect('/admin');
}

function fmt(iso: string | null) {
  if (!iso) return 'sin fecha';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AgendaPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAdminSession();
  const { slug } = await params;

  const db = getSupabaseAdmin();
  const { data: item } = await db
    .from('post_publications')
    .select('*')
    .eq('post_slug', slug)
    .maybeSingle<PostPublication>();

  const post = await getBlogPostBySlug(slug);

  if (!item && !post) notFound();

  const statusColor = item ? STATUS_COLORS[item.status] : null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <Link
        href="/admin/agenda"
        style={{
          fontSize: 12,
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          opacity: 0.6,
        }}
      >
        ← Agenda
      </Link>

      <div
        style={{
          marginTop: 16,
          padding: 20,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#111827',
          display: 'grid',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 17 }}>{item?.raw_title ?? post?.title ?? slug}</span>
          {item && statusColor && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 10px',
                borderRadius: 20,
                fontFamily: 'monospace',
                background: statusColor.bg,
                color: statusColor.color,
              }}
            >
              {STATUS_LABELS[item.status]}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'monospace', opacity: 0.5 }}>{slug}</div>

        {item && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            <span>Programado: {fmt(item.scheduled_at)}</span>
            <span>Preaprobado: {fmt(item.pre_approved_at)}</span>
            <span>Publicado: {fmt(item.published_at)}</span>
            <span>Newsletter: {fmt(item.notified_at)}</span>
          </div>
        )}

        {item?.notify_error && (
          <p
            style={{
              fontSize: 12,
              color: '#f87171',
              margin: 0,
              padding: 10,
              borderRadius: 8,
              border: '1px solid rgba(248,113,113,0.3)',
              background: 'rgba(248,113,113,0.06)',
            }}
          >
            Último intento de envío falló ({item.notify_attempts}): {item.notify_error}. El cron lo
            reintenta solo.
          </p>
        )}

        {post ? (
          <a
            href={previewUrl(slug)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#00d4d4',
              color: '#0a0a14',
              border: 'none',
              borderRadius: 8,
              padding: '12px 20px',
              fontWeight: 700,
              fontSize: 14,
              textAlign: 'center',
              textDecoration: 'none',
            }}
            className="transition-[filter] hover:brightness-110"
          >
            Ver el post como se va a publicar →
          </a>
        ) : (
          <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>
            Todavía no existe el archivo .mdx de este post — solo hay texto en bruto en la agenda,
            falta hardcodearlo y deployarlo.
          </p>
        )}
      </div>

      {item?.raw_content && (
        <div
          style={{
            marginTop: 20,
            padding: 20,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#111827',
          }}
        >
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#00d4d4',
              margin: '0 0 12px',
            }}
          >
            Texto en bruto guardado
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#94a3b8',
              margin: 0,
              maxHeight: 460,
              overflow: 'auto',
            }}
          >
            {item.raw_content}
          </pre>
        </div>
      )}
    </div>
  );
}
