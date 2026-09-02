import { ImageResponse } from 'next/og';
import { getBlogPostBySlug } from '@/lib/mdx';
import { getVisibilityIndex, isPostVisible } from '@/lib/post-publications/visibility';

export const runtime = 'nodejs';

const CATEGORY_COLOR: Record<string, string> = {
  Performance: '#4ade80',
  Producto: '#c084fc',
  Automatización: '#fbbf24',
  Criterio: '#818cf8',
  Editorial: '#22d3d3',
};

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return new Response('Not found', { status: 404 });
  }

  // La imagen lleva el título: un post oculto no puede filtrarlo por acá.
  const visibility = await getVisibilityIndex();
  if (!isPostVisible(post, visibility)) {
    return new Response('Not found', { status: 404 });
  }

  const accent = CATEGORY_COLOR[post.category] ?? '#22d3d3';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0e14',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 22,
              fontWeight: 700,
              color: '#94a3b8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            El Radar
          </div>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#334155' }} />
          <div
            style={{
              fontSize: 16,
              color: accent,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              border: `1px solid ${accent}55`,
              borderRadius: 999,
              padding: '6px 16px',
            }}
          >
            {post.category}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#eef2f5',
            maxWidth: '980px',
          }}
        >
          {post.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: `radial-gradient(circle at 40% 35%, ${accent}, #0a2a5e 70%)`,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 18, color: '#e2e8f0', fontWeight: 600 }}>Silvano Puccini</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>Full Stack Engineer</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
