'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { s } from '@/components/admin/AdminShell';
import CarouselPreview from '@/components/admin/distribution/CarouselPreview';
import SlideEditor from '@/components/admin/distribution/SlideEditor';
import type { Distribution, DistributionStatus } from '@/lib/distribution/types';
import { DistributionDetailSkeleton } from '@/components/admin/distribution/Skeleton';

type Platform = 'linkedin' | 'instagram' | 'twitter';

const STATUS_COLORS: Record<DistributionStatus, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(100,116,139,0.12)', color: '#64748b' },
  approved:  { bg: 'rgba(0,212,212,0.1)',    color: '#00d4d4' },
  published: { bg: 'rgba(74,222,128,0.1)',   color: '#4ade80' },
  archived:  { bg: 'rgba(71,85,105,0.15)',   color: '#475569' },
  error:     { bg: 'rgba(248,113,113,0.1)',  color: '#f87171' },
};

const STATUS_LABELS: Record<DistributionStatus, string> = {
  draft: 'Borrador', approved: 'Aprobado', published: 'Publicado',
  archived: 'Archivado', error: 'Error',
};

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} style={{ ...s.btnGhost, fontSize: 11, padding: '5px 12px' }}>
      {copied ? '✓ Copiado' : label}
    </button>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Export PDF (LinkedIn print) ───────────────────────────────

function renderSlideHTML(slide: import('@/lib/distribution/types').LinkedInSlide, idx: number, total: number): string {
  const counter = `<span class="counter">${idx + 1} / ${total}</span>`;

  const topBar = (label: string) => `
    <div class="top-bar">
      <span class="tag">${label}</span>
      ${counter}
    </div>`;

  const footer = `<div class="footer">silvanopuccini.dev · El Radar</div>`;

  switch (slide.type) {
    case 'portada':
      return `
        ${topBar(slide.tag ?? 'EL RADAR')}
        <div class="content center">
          <h1>${slide.headline}</h1>
          <p class="subtitle">${slide.subtitle ?? slide.body}</p>
        </div>
        ${footer}`;

    case 'problema':
      return `
        ${topBar('PROBLEMA')}
        <div class="content">
          <h2>${slide.headline}</h2>
          <p class="body">${slide.body}</p>
          ${slide.pills?.length ? `<div class="pills">${slide.pills.map(p => `<span class="pill">${p}</span>`).join('')}</div>` : ''}
        </div>
        ${footer}`;

    case 'idea':
      return `
        ${topBar(`IDEA ${slide.icon_num ?? idx}`)}
        <div class="content">
          <h2>${slide.headline}</h2>
          <p class="body">${slide.body}</p>
          ${slide.code_snippet ? `<pre class="code">${slide.code_snippet}</pre>` : ''}
        </div>
        ${footer}`;

    case 'resumen':
      return `
        ${topBar('RESUMEN')}
        <div class="content">
          <h2>${slide.headline}</h2>
          <p class="body">${slide.body}</p>
          <ul class="points">${(slide.points ?? []).map(p => `<li>${p}</li>`).join('')}</ul>
        </div>
        ${footer}`;

    case 'engagement':
      return `
        ${topBar('PARA VOS')}
        <div class="content center">
          <h2>${slide.headline}</h2>
          <p class="body">${slide.body}</p>
        </div>
        ${footer}`;

    case 'cta':
      return `
        ${topBar('EL RADAR')}
        <div class="content center">
          <h2 class="accent">${slide.headline}</h2>
          <p class="body">${slide.body}</p>
        </div>
        ${footer}`;

    default:
      return `
        ${topBar('SLIDE')}
        <div class="content"><p class="body">${slide.body}</p></div>
        ${footer}`;
  }
}

function downloadLinkedInPDF(dist: import('@/lib/distribution/types').Distribution) {
  const li = dist.linkedin_content;
  if (!li) return;

  const slides = li.slides;
  const total = slides.length;

  const CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: 180mm 180mm; margin: 0; }
    body { background: #0f0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #f0f0f0; }
    .slide { width: 180mm; height: 180mm; padding: 12mm 13mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; background: #0f0f14; }
    .top-bar { display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .tag { font-family: monospace; font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: #00d4d4; font-weight: 600; }
    .counter { font-family: monospace; font-size: 9pt; color: rgba(255,255,255,0.28); }
    .content { flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 14pt; padding: 14pt 0 0; }
    .content.center { justify-content: center; }
    h1 { font-size: 34pt; font-weight: 800; line-height: 1.08; letter-spacing: -0.025em; color: #f0f0f0; }
    h2 { font-size: 26pt; font-weight: 700; line-height: 1.10; letter-spacing: -0.020em; color: #f0f0f0; }
    .accent { color: #00d4d4; }
    .subtitle { font-size: 13pt; color: rgba(255,255,255,0.65); line-height: 1.4; }
    .body { font-size: 11pt; color: rgba(255,255,255,0.70); line-height: 1.55; white-space: pre-wrap; }
    .pills { display: flex; flex-wrap: wrap; gap: 6pt; margin-top: 4pt; }
    .pill { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); border-radius: 20pt; padding: 3pt 10pt; font-size: 9pt; font-family: monospace; }
    .code { background: rgba(0,212,212,0.07); border-left: 3pt solid #00d4d4; padding: 8pt 10pt; font-family: monospace; font-size: 9pt; color: #00d4d4; border-radius: 4pt; white-space: pre-wrap; }
    .points { list-style: none; display: flex; flex-direction: column; gap: 8pt; }
    .points li { font-size: 11pt; color: rgba(255,255,255,0.75); line-height: 1.4; padding-left: 14pt; position: relative; }
    .points li::before { content: '→'; position: absolute; left: 0; color: #00d4d4; }
    .footer { font-family: monospace; font-size: 7pt; color: rgba(255,255,255,0.18); letter-spacing: 0.08em; }
    .caption-page { width: 180mm; min-height: 180mm; padding: 12mm 13mm; background: #0f0f14; }
    .caption-label { font-family: monospace; font-size: 9pt; letter-spacing: 0.18em; text-transform: uppercase; color: #00d4d4; margin-bottom: 10pt; }
    .caption-text { font-size: 11pt; color: rgba(255,255,255,0.75); line-height: 1.6; white-space: pre-wrap; margin-bottom: 20pt; }
    .hashtags { display: flex; flex-wrap: wrap; gap: 6pt; }
    .hashtag { color: #8B5CF6; font-size: 10pt; font-family: monospace; }
  `;

  const slidesHTML = slides.map((sl, i) =>
    `<div class="slide">${renderSlideHTML(sl, i, total)}</div>`
  ).join('');

  const captionHTML = `
    <div class="caption-page">
      <p class="caption-label">Caption del post</p>
      <p class="caption-text">${li.caption}</p>
      <p class="caption-label">Hashtags</p>
      <div class="hashtags">${li.hashtags.map(h => `<span class="hashtag">#${h}</span>`).join('')}</div>
    </div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${dist.post_title} — LinkedIn</title>
  <style>${CSS}</style>
</head>
<body>
  ${slidesHTML}
  ${captionHTML}
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

// ── Export texto estructurado ─────────────────────────────────

function downloadTextContent(dist: import('@/lib/distribution/types').Distribution) {
  const li = dist.linkedin_content;
  if (!li) return;

  const sep = '─'.repeat(52);
  const lines: string[] = [
    `EL RADAR — ${dist.post_title.toUpperCase()}`,
    `Post: ${dist.post_slug}`,
    sep,
    '',
  ];

  li.slides.forEach((sl, i) => {
    const label = sl.type === 'idea' ? `IDEA ${sl.icon_num}` : sl.type.toUpperCase();
    lines.push(`SLIDE ${i + 1} — ${label}`);

    if (sl.tag)          lines.push(`Tag: ${sl.tag}`);
    if (sl.headline)     lines.push(`Headline: ${sl.headline}`);
    if (sl.subtitle)     lines.push(`Subtitle: ${sl.subtitle}`);
    if (sl.body)         lines.push(``, sl.body);
    if (sl.pills?.length) lines.push(``, `Pills: ${sl.pills.join(' · ')}`);
    if (sl.code_snippet) lines.push(``, `Código: ${sl.code_snippet}`);
    if (sl.points?.length) {
      lines.push('');
      sl.points.forEach((p, pi) => lines.push(`${pi + 1}. ${p}`));
    }

    lines.push('', sep, '');
  });

  lines.push(
    'CAPTION',
    li.caption,
    '',
    sep,
    '',
    'HASHTAGS',
    li.hashtags.map((h) => `#${h}`).join('  '),
  );

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `linkedin-${dist.post_slug}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Export ZIP ────────────────────────────────────────────────

async function downloadZip(dist: Distribution) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const platforms: Array<{ key: 'linkedin' | 'instagram'; images: string[] }> = [
    { key: 'linkedin', images: dist.linkedin_images ?? [] },
    { key: 'instagram', images: dist.instagram_images ?? [] },
  ];

  for (const { key, images } of platforms) {
    if (!images.length) continue;
    const folder = zip.folder(key)!;
    for (let i = 0; i < images.length; i++) {
      const res = await fetch(images[i]);
      const blob = await res.blob();
      const buf = await blob.arrayBuffer();
      folder.file(`slide-${String(i + 1).padStart(2, '0')}.png`, buf);
    }
  }

  // README con texto
  const twitter = dist.twitter_content?.tweets?.join('\n\n───\n\n') ?? '';
  const liCaption = dist.linkedin_content?.caption ?? '';
  const igCaption = dist.instagram_content?.caption ?? '';
  const liHashtags = dist.linkedin_content?.hashtags?.map((h) => `#${h}`).join(' ') ?? '';
  const igHashtags = dist.instagram_content?.hashtags?.map((h) => `#${h}`).join(' ') ?? '';

  const readme = [
    `# ${dist.post_title}`,
    `Slug: ${dist.post_slug}`,
    `Generado: ${fmt(dist.created_at)}`,
    '',
    '## LinkedIn',
    '### Caption',
    liCaption,
    '',
    '### Hashtags',
    liHashtags,
    '',
    '## Instagram',
    '### Caption',
    igCaption,
    '',
    '### Hashtags',
    igHashtags,
    '',
    '## Twitter / X',
    twitter,
  ].join('\n');

  zip.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `distribucion-${dist.post_slug}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Página ────────────────────────────────────────────────────

export default function DistribucionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dist, setDist] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [activeSlide, setActiveSlide] = useState(0);
  const [approving, setApproving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/distributions/${id}`, {});
      if (!res.ok) throw new Error(`Error ${res.status} al cargar la distribución`);
      const data = await res.json() as { distribution: Distribution; error?: string };
      if (data.error) throw new Error(data.error);
      setDist(data.distribution);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Resetear slide al cambiar de plataforma
  useEffect(() => { setActiveSlide(0); }, [platform]);

  async function handleApprove() {
    if (!dist) return;
    setApproving(true);
    const newStatus: DistributionStatus = dist.status === 'approved' ? 'draft' : 'approved';
    await fetch(`/api/admin/distributions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setDist((d) => d ? { ...d, status: newStatus } : d);
    setApproving(false);
  }

  async function handleRegenerateAll() {
    if (!dist) return;
    setRegeneratingAll(true);
    await fetch(`/api/admin/distributions/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'all' }),
    });
    await load();
    setRegeneratingAll(false);
  }

  function handleSlideUpdate(idx: number, updated: { type: string; headline: string; body: string }) {
    setDist((prev) => {
      if (!prev) return prev;
      const field = platform === 'linkedin' ? 'linkedin_content' : 'instagram_content';
      const content = prev[field];
      if (!content) return prev;
      const newSlides = [...content.slides];
      newSlides[idx] = updated as typeof newSlides[0];
      return { ...prev, [field]: { ...content, slides: newSlides } };
    });
  }

  async function handleDownloadZip() {
    if (!dist) return;
    setDownloading(true);
    await downloadZip(dist);
    setDownloading(false);
  }

  if (loading) return <DistributionDetailSkeleton />;

  if (loadError || !dist) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: 40, maxWidth: 480, margin: '0 auto' }}>
        <p style={{ fontSize: 24, marginBottom: 12 }}>⚠</p>
        <p style={{ color: '#f87171', fontSize: 14, marginBottom: 16 }}>
          {loadError || 'Distribución no encontrada.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={load} style={s.btn}>Reintentar</button>
          <Link href="/admin/distribuciones">
            <button style={s.btnGhost}>← Volver a la lista</button>
          </Link>
        </div>
      </div>
    );
  }

  // Alerta si la distribución tiene status error
  const hasError = dist.status === 'error';

  const liContent = dist.linkedin_content;
  const igContent = dist.instagram_content;
  const twContent = dist.twitter_content;
  const status = dist.status as DistributionStatus;
  const { bg: statusBg, color: statusColor } = STATUS_COLORS[status];

  const currentSlides = platform === 'linkedin'
    ? (liContent?.slides ?? [])
    : (igContent?.slides ?? []);
  const currentImages = platform === 'linkedin'
    ? (dist.linkedin_images ?? [])
    : (dist.instagram_images ?? []);
  const currentContent = platform === 'linkedin' ? liContent : igContent;

  return (
    <div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
          <Link href="/admin/distribuciones" style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', textDecoration: 'none' }}>
            ← Distribuciones
          </Link>
          <h1 style={{ ...s.heading, fontSize: 22, margin: '6px 0 8px' }}>{dist.post_title}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace', background: statusBg, color: statusColor }}>
              {STATUS_LABELS[status]}
            </span>
            {dist.ai_metadata && (
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                {dist.ai_metadata.model} · {dist.ai_metadata.tokens_used.toLocaleString()} tokens · {fmt(dist.ai_metadata.generated_at)}
              </span>
            )}
          </div>
        </div>

        {/* Acciones header */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleRegenerateAll}
            disabled={regeneratingAll}
            style={{ ...s.btnGhost, fontSize: 12, color: '#8B5CF6', borderColor: '#8B5CF620', opacity: regeneratingAll ? 0.5 : 1 }}
          >
            {regeneratingAll ? 'Regenerando...' : '✦ Regenerar todo'}
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            style={{
              ...s.btn,
              background: status === 'approved' ? '#1e293b' : '#00d4d4',
              color: status === 'approved' ? '#64748b' : '#0a0a14',
              opacity: approving ? 0.6 : 1,
              fontSize: 12,
            }}
          >
            {approving ? '...' : status === 'approved' ? '✓ Aprobado' : 'Aprobar ✓'}
          </button>
        </div>
      </div>

      {/* Banner de error de generación */}
      {hasError && dist.error_message && (
        <div style={{
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#f87171', marginBottom: 4 }}>
              ERROR DE GENERACIÓN
            </p>
            <p style={{ fontSize: 13, color: '#fca5a5', margin: 0 }}>{dist.error_message}</p>
          </div>
          <button
            onClick={handleRegenerateAll}
            disabled={regeneratingAll}
            style={{ ...s.btn, background: '#f87171', color: '#0a0a14', fontSize: 12, flexShrink: 0 }}
          >
            {regeneratingAll ? 'Reintentando...' : 'Reintentar generación'}
          </button>
        </div>
      )}

      {/* Tabs plataforma */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {([['linkedin', '💼 LinkedIn'], ['instagram', '📸 Instagram'], ['twitter', '🐦 Twitter']] as [Platform, string][]).map(([p, label]) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            style={{
              background: 'none', border: 'none', borderBottom: `2px solid ${platform === p ? '#00d4d4' : 'transparent'}`,
              color: platform === p ? '#00d4d4' : '#475569',
              padding: '10px 16px', fontSize: 13, fontWeight: platform === p ? 600 : 400,
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── LinkedIn / Instagram ── */}
      {(platform === 'linkedin' || platform === 'instagram') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Preview */}
          <div>
            {currentSlides.length > 0 ? (
              <CarouselPreview
                slides={currentSlides}
                images={currentImages}
                platform={platform}
                activeIndex={activeSlide}
                onSlideChange={setActiveSlide}
              />
            ) : (
              <div style={{ ...s.card, textAlign: 'center', padding: 32 }}>
                <p style={{ color: '#475569', fontSize: 13 }}>Sin slides generados.</p>
              </div>
            )}
          </div>

          {/* Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {currentSlides[activeSlide] && (
              <div style={s.card}>
                <p style={{ ...s.eyebrow, marginBottom: 12 }}>Editor — Slide {activeSlide + 1}</p>
                <SlideEditor
                  slide={currentSlides[activeSlide]}
                  slideIndex={activeSlide}
                  platform={platform}
                  distributionId={id}
                  onSave={handleSlideUpdate}
                />
              </div>
            )}

            {/* Caption */}
            {currentContent?.caption && (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={s.eyebrow}>Caption del post</p>
                  <CopyButton text={currentContent.caption} />
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {currentContent.caption}
                </p>
              </div>
            )}

            {/* Hashtags */}
            {currentContent?.hashtags && currentContent.hashtags.length > 0 && (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={s.eyebrow}>Hashtags</p>
                  <CopyButton text={currentContent.hashtags.map((h) => `#${h}`).join(' ')} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {currentContent.hashtags.map((h) => (
                    <span key={h} style={{
                      background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                      borderRadius: 6, padding: '3px 10px', fontSize: 12,
                      fontFamily: 'monospace',
                    }}>
                      #{h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Twitter ── */}
      {platform === 'twitter' && (
        <div style={{ maxWidth: 600 }}>
          {twContent?.tweets?.map((tweet, i) => (
            <div key={i} style={{
              ...s.card,
              marginBottom: 10,
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', marginBottom: 8, display: 'block' }}>
                    [{i + 1}/{twContent.tweets.length}]
                  </span>
                  <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {tweet}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: 11, color: tweet.length > 240 ? '#f87171' : '#334155', margin: '8px 0 0' }}>
                    {tweet.length} chars
                  </p>
                </div>
                <CopyButton text={tweet} />
              </div>
            </div>
          ))}

          {twContent?.tweets && twContent.tweets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <CopyButton
                text={twContent.tweets.join('\n\n───\n\n')}
                label="Copiar hilo completo"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Export panel ── */}
      <div style={{ ...s.card, marginTop: 28 }}>
        <p style={{ ...s.eyebrow, marginBottom: 12 }}>Descargar assets</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => downloadTextContent(dist)}
            style={{ ...s.btn, background: '#00d4d4', color: '#0a0a14', fontSize: 12 }}
          >
            ↓ Texto por slide (.txt)
          </button>
          <button
            onClick={() => downloadLinkedInPDF(dist)}
            style={{ ...s.btn, background: '#8B5CF6', color: '#fff', fontSize: 12 }}
          >
            ↓ PDF referencia (Canva)
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            style={{ ...s.btn, opacity: downloading ? 0.6 : 1, fontSize: 12 }}
          >
            {downloading ? 'Preparando ZIP...' : '↓ Descargar pack completo (ZIP)'}
          </button>

          {dist.linkedin_images?.map((url, i) => (
            <a key={i} href={url} download={`linkedin-slide-${i + 1}.png`} target="_blank" rel="noreferrer">
              <button style={{ ...s.btnGhost, fontSize: 11 }}>
                ↓ LI {i + 1}
              </button>
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {liContent?.caption && <CopyButton text={liContent.caption} label="📋 Caption LinkedIn" />}
          {igContent?.caption && <CopyButton text={igContent.caption} label="📋 Caption Instagram" />}
          {liContent?.hashtags && <CopyButton text={liContent.hashtags.map((h) => `#${h}`).join(' ')} label="📋 Hashtags LinkedIn" />}
          {twContent?.tweets && <CopyButton text={twContent.tweets.join('\n\n───\n\n')} label="📋 Hilo Twitter" />}
        </div>
      </div>

    </div>
  );
}
