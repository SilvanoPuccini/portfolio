import type { Slide } from '../types';

// Fuentes del sistema — sin requests externos para compatibilidad con Vercel Lambda
const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1080px;
    background: #111118;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px;
    overflow: hidden;
  }
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 14px;
    color: rgba(255,255,255,0.35);
    flex-shrink: 0;
  }
  .nav .logo { color: #8B5CF6; font-weight: 500; letter-spacing: 0.02em; }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 28px;
    padding: 40px 0;
  }
  .label {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    color: #8B5CF6;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .headline {
    font-size: 58px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.025em;
    color: #ffffff;
  }
  .headline .accent { color: #8B5CF6; }
  .body {
    font-size: 23px;
    line-height: 1.55;
    color: rgba(255,255,255,0.72);
    max-width: 860px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.28);
    flex-shrink: 0;
  }
  .footer .page { color: rgba(255,255,255,0.5); font-weight: 500; }
  .footer .cta-hint { color: rgba(139,92,246,0.65); }

  /* Variante hook — headline más grande */
  .slide-hook .headline { font-size: 66px; }

  /* Variante cta — fondo levemente diferente */
  .slide-cta body { background: #0f0f17; }
  .slide-cta .headline { font-size: 50px; color: #8B5CF6; }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBody(body: string): string {
  return escapeHtml(body).replace(/\n/g, '<br>');
}

function getLabel(slide: Slide, slideNumber: number): string {
  if (slide.type === 'hook') return 'El Radar';
  if (slide.type === 'cta') return 'En resumen';
  return `Punto ${slideNumber - 1}`;
}

export function renderLinkedInSlide(
  slide: Slide,
  slideNumber: number,
  total: number
): string {
  const label = getLabel(slide, slideNumber);
  const bodyHtml = formatBody(slide.body);
  const headlineHtml = escapeHtml(slide.headline);
  const slideClass = `slide-${slide.type}`;
  const ctaHint = slideNumber < total ? '→ deslizá' : '↗ artículo completo';

  return `<!DOCTYPE html>
<html class="${slideClass}">
  <head>
    <meta charset="UTF-8">
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="nav">
      <span class="logo">SP developer</span>
      <span>silvanopuccini.dev</span>
    </div>
    <div class="content">
      <div class="label">${escapeHtml(label)}</div>
      <h1 class="headline">${headlineHtml}</h1>
      <p class="body">${bodyHtml}</p>
    </div>
    <div class="footer">
      <span class="page">${slideNumber} / ${total}</span>
      <span class="cta-hint">${ctaHint}</span>
    </div>
  </body>
</html>`;
}
