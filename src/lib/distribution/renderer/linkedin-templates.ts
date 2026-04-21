import type { LinkedInSlide } from '../types';

// System fonts only — no external requests (Vercel Lambda compatibility)
const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: 1080px;
    height: 1080px;
    background: #0f0f14;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: #f0f0f0;
    overflow: hidden;
  }

  .slide {
    width: 1080px;
    height: 1080px;
    padding: 72px 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* ── Top bar ── */
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .tag {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    color: #00d4d4;
    font-weight: 600;
  }
  .counter {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0.06em;
  }
  .slide-label {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    letter-spacing: 0.20em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }

  /* ── Content area ── */
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
    padding: 40px 0;
  }

  /* ── Typography ── */
  h1 {
    font-size: 64px;
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.030em;
    color: #f0f0f0;
  }
  h2 {
    font-size: 52px;
    font-weight: 700;
    line-height: 1.10;
    letter-spacing: -0.025em;
    color: #f0f0f0;
  }
  .accent { color: #00d4d4; }
  .subtitle {
    font-size: 22px;
    line-height: 1.55;
    color: rgba(255,255,255,0.55);
  }
  .divider {
    width: 56px;
    height: 3px;
    background: #00d4d4;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .body-text {
    font-size: 24px;
    line-height: 1.60;
    color: rgba(255,255,255,0.75);
  }
  code {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 0.88em;
    background: #1a1a2e;
    color: #00d4d4;
    padding: 2px 8px;
    border-radius: 4px;
  }

  /* ── Author row ── */
  .author-row {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
  }
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #00d4d4;
    color: #0f0f14;
    font-weight: 800;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: -0.02em;
  }
  .author-name {
    font-size: 16px;
    font-weight: 600;
    color: #f0f0f0;
    line-height: 1.2;
  }
  .author-handle {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.40);
    margin-top: 2px;
  }

  /* ── Pill row (problema) ── */
  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .pill {
    background: rgba(0, 212, 212, 0.10);
    border: 1px solid rgba(0, 212, 212, 0.30);
    color: #00d4d4;
    font-size: 14px;
    font-weight: 600;
    padding: 6px 18px;
    border-radius: 100px;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* ── Idea row ── */
  .idea-row {
    display: flex;
    align-items: center;
    gap: 22px;
  }
  .icon-num {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid #00d4d4;
    color: #00d4d4;
    font-size: 26px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
  }
  .idea-title {
    font-size: 46px;
    font-weight: 700;
    line-height: 1.10;
    letter-spacing: -0.022em;
    color: #f0f0f0;
  }
  .code-block {
    background: #1a1a2e;
    border-left: 3px solid #00d4d4;
    padding: 18px 22px;
    border-radius: 0 8px 8px 0;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 20px;
    color: #00d4d4;
    line-height: 1.5;
  }

  /* ── Arrow list (resumen) ── */
  .arrow-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .arrow-list li {
    font-size: 26px;
    line-height: 1.45;
    color: rgba(255,255,255,0.80);
    display: flex;
    gap: 14px;
  }
  .arrow-list li::before {
    content: '→';
    color: #00d4d4;
    font-weight: 700;
    flex-shrink: 0;
  }

  /* ── CTA box (cta slide) ── */
  .cta-box {
    background: #00d4d4;
    border-radius: 16px;
    padding: 36px 40px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cta-box-title {
    font-size: 32px;
    font-weight: 800;
    color: #0f0f14;
    line-height: 1.15;
    letter-spacing: -0.020em;
  }
  .cta-box-body {
    font-size: 19px;
    line-height: 1.55;
    color: rgba(15, 15, 20, 0.75);
  }
  .newsletter-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 10px;
    padding: 18px 22px;
    font-size: 17px;
    color: rgba(255,255,255,0.50);
    text-align: center;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    letter-spacing: 0.02em;
  }

  /* ── Follow CTA (engagement) ── */
  .follow-cta {
    font-size: 22px;
    color: rgba(255,255,255,0.45);
    margin-top: 4px;
  }
  .follow-cta .accent { font-weight: 700; }
`;

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bodyHtml(text: string): string {
  return esc(text).replace(/\n/g, '<br>');
}

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>${BASE_STYLES}</style>
  </head>
  <body>${inner}</body>
</html>`;
}

// ── Slide renderers ───────────────────────────────────────────

function renderPortada(slide: LinkedInSlide, n: number, total: number): string {
  const tag = esc(slide.tag ?? 'El Radar');
  const headline = esc(slide.headline);
  const subtitle = esc(slide.subtitle ?? slide.body);
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="tag">${tag}</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content">
      <h1>${headline}</h1>
      <div class="divider"></div>
      <p class="subtitle">${subtitle}</p>
    </div>
    <div class="author-row">
      <div class="avatar">SP</div>
      <div>
        <div class="author-name">Silvano Puccini</div>
        <div class="author-handle">silvano.dev</div>
      </div>
    </div>
  </div>`);
}

function renderProblema(slide: LinkedInSlide, n: number, total: number): string {
  const pills = (slide.pills ?? [])
    .map((p) => `<span class="pill">${esc(p)}</span>`)
    .join('');
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="slide-label">EL PROBLEMA</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content">
      <h2>${esc(slide.headline)}</h2>
      <p class="body-text">${bodyHtml(slide.body)}</p>
      ${pills ? `<div class="pill-row">${pills}</div>` : ''}
    </div>
  </div>`);
}

function renderIdea(slide: LinkedInSlide, n: number, total: number): string {
  const num = slide.icon_num ?? (n - 2);
  const codeBlock = slide.code_snippet
    ? `<div class="code-block">${esc(slide.code_snippet)}</div>`
    : '';
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="slide-label">IDEA</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content">
      <div class="idea-row">
        <div class="icon-num">${num}</div>
        <h2 class="idea-title">${esc(slide.headline)}</h2>
      </div>
      <p class="body-text">${bodyHtml(slide.body)}</p>
      ${codeBlock}
    </div>
  </div>`);
}

function renderResumen(slide: LinkedInSlide, n: number, total: number): string {
  const items = (slide.points ?? [])
    .map((p) => `<li>${esc(p)}</li>`)
    .join('');
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="slide-label">RESUMEN</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content">
      <h2>${esc(slide.headline)}</h2>
      ${items ? `<ul class="arrow-list">${items}</ul>` : `<p class="body-text">${bodyHtml(slide.body)}</p>`}
    </div>
  </div>`);
}

function renderEngagement(slide: LinkedInSlide, n: number, total: number): string {
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="slide-label">¿TE RESULTÓ ÚTIL?</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content">
      <h2>${esc(slide.headline)}</h2>
      <p class="body-text">${bodyHtml(slide.body)}</p>
      <p class="follow-cta">Seguime → <span class="accent">silvano.dev</span></p>
    </div>
  </div>`);
}

function renderCta(slide: LinkedInSlide, n: number, total: number): string {
  return wrap(`
  <div class="slide">
    <div class="top-bar">
      <span class="tag">El Radar</span>
      <span class="counter">${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
    </div>
    <div class="content" style="gap:20px;">
      <div class="cta-box">
        <div class="cta-box-title">${esc(slide.headline)}</div>
        <div class="cta-box-body">${bodyHtml(slide.body)}</div>
      </div>
      <div class="newsletter-box">📬 El Radar — newsletter técnico para developers</div>
    </div>
    <div class="author-row">
      <div class="avatar">SP</div>
      <div>
        <div class="author-name">Silvano Puccini</div>
        <div class="author-handle">silvano.dev</div>
      </div>
    </div>
  </div>`);
}

// ── Public API ────────────────────────────────────────────────

export function renderLinkedInSlide(
  slide: LinkedInSlide,
  slideNumber: number,
  total: number
): string {
  switch (slide.type) {
    case 'portada':    return renderPortada(slide, slideNumber, total);
    case 'problema':   return renderProblema(slide, slideNumber, total);
    case 'idea':       return renderIdea(slide, slideNumber, total);
    case 'resumen':    return renderResumen(slide, slideNumber, total);
    case 'engagement': return renderEngagement(slide, slideNumber, total);
    case 'cta':        return renderCta(slide, slideNumber, total);
  }
}
