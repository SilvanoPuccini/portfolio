import type { Slide } from '../types';


// Instagram: misma identidad visual pero headlines más cortos y body más compacto
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
    padding: 80px;
    overflow: hidden;
  }
  .nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 13px;
    color: rgba(255,255,255,0.35);
    flex-shrink: 0;
  }
  .nav .logo { color: #8B5CF6; font-weight: 500; }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    padding: 36px 0;
  }
  .label {
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 12px;
    color: #8B5CF6;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  .headline {
    font-size: 72px;
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .body {
    font-size: 22px;
    line-height: 1.5;
    color: rgba(255,255,255,0.7);
    max-width: 820px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    font-family: 'ui-monospace', 'SFMono-Regular', Menlo, monospace;
    font-size: 12px;
    color: rgba(255,255,255,0.25);
    flex-shrink: 0;
  }
  .footer .page { color: rgba(255,255,255,0.45); font-weight: 500; }
  .footer .hint { color: rgba(139,92,246,0.6); }

  /* Dots indicator */
  .dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
  }
  .dot.active {
    background: #8B5CF6;
    width: 18px;
    border-radius: 3px;
  }

  .slide-hook .headline { font-size: 80px; }
  .slide-cta .headline { font-size: 60px; color: #8B5CF6; }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildDots(current: number, total: number): string {
  return Array.from({ length: total }, (_, i) =>
    `<div class="dot${i === current - 1 ? ' active' : ''}"></div>`
  ).join('');
}

export function renderInstagramSlide(
  slide: Slide,
  slideNumber: number,
  total: number
): string {
  const bodyHtml = escapeHtml(slide.body).replace(/\n/g, '<br>');
  const headlineHtml = escapeHtml(slide.headline);
  const slideClass = `slide-${slide.type}`;
  const label = slide.type === 'hook' ? 'El Radar' : slide.type === 'cta' ? 'En resumen' : `${slideNumber - 1} / ${total - 1}`;

  return `<!DOCTYPE html>
<html class="${slideClass}">
  <head>
    <meta charset="UTF-8">
    <style>${BASE_STYLES}</style>
  </head>
  <body>
    <div class="nav">
      <span class="logo">SP developer</span>
      <div class="dots">${buildDots(slideNumber, total)}</div>
    </div>
    <div class="content">
      <div class="label">${escapeHtml(label)}</div>
      <h1 class="headline">${headlineHtml}</h1>
      <p class="body">${bodyHtml}</p>
    </div>
    <div class="footer">
      <span class="page">${slideNumber} / ${total}</span>
      <span class="hint">silvanopuccini.dev</span>
    </div>
  </body>
</html>`;
}
