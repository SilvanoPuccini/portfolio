'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const SLIDE_ANIM = `
  @keyframes slide-fade-in {
    from { opacity: 0; transform: translateX(12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slide-fade-in-left {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

interface Slide {
  type: string;
  headline: string;
  body: string;
}

interface CarouselPreviewProps {
  slides: Slide[];
  images: string[];           // URLs de Supabase Storage
  platform: 'linkedin' | 'instagram';
  activeIndex: number;
  onSlideChange: (idx: number) => void;
}

export default function CarouselPreview({
  slides,
  images,
  platform,
  activeIndex,
  onSlideChange,
}: CarouselPreviewProps) {
  const [lightbox, setLightbox] = useState(false);
  const [animDir, setAnimDir] = useState<'right' | 'left'>('right');
  const [animKey, setAnimKey] = useState(0);
  const prevIndexRef = useRef(activeIndex);
  const total = slides.length;

  // Detecta dirección de navegación para la animación
  useEffect(() => {
    setAnimDir(activeIndex > prevIndexRef.current ? 'right' : 'left');
    setAnimKey((k) => k + 1);
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  const prev = useCallback(() => onSlideChange(Math.max(0, activeIndex - 1)), [activeIndex, onSlideChange]);
  const next = useCallback(() => onSlideChange(Math.min(total - 1, activeIndex + 1)), [activeIndex, total, onSlideChange]);

  // Teclado ← →
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightbox(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next]);

  const hasImage = images[activeIndex];
  const slide = slides[activeIndex];
  const slideAnim = animDir === 'right' ? 'slide-fade-in' : 'slide-fade-in-left';

  return (
    <>
      <style>{SLIDE_ANIM}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Slide principal */}
        <div style={{ position: 'relative' }}>
          {hasImage ? (
            <img
              key={animKey}
              src={images[activeIndex]}
              alt={`Slide ${activeIndex + 1}`}
              style={{
                width: '100%', aspectRatio: '1/1', objectFit: 'cover',
                borderRadius: 10, border: '1px solid #1e293b',
                cursor: 'zoom-in', display: 'block',
                animation: `${slideAnim} 0.2s ease-out`,
              }}
              onClick={() => setLightbox(true)}
            />
          ) : (
            // Fallback visual cuando no hay imagen renderizada aún
            <div key={animKey} style={{
              width: '100%', aspectRatio: '1/1', borderRadius: 10,
              border: '1px solid #1e293b', background: '#111118',
              animation: `${slideAnim} 0.2s ease-out`,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '10%',
              boxSizing: 'border-box',
            }}>
              <p style={{
                fontFamily: 'monospace', fontSize: 11, color: '#8B5CF6',
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
              }}>
                {slide?.type === 'hook' ? 'El Radar' : slide?.type === 'cta' ? 'En resumen' : `Punto ${activeIndex}`}
              </p>
              <p style={{
                fontSize: 22, fontWeight: 700, color: '#fff',
                lineHeight: 1.2, marginBottom: 16,
              }}>
                {slide?.headline}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                {slide?.body?.substring(0, 160)}{(slide?.body?.length ?? 0) > 160 ? '…' : ''}
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 24 }}>
                silvanopuccini.dev
              </p>
            </div>
          )}

          {/* Indicador */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 20,
            padding: '4px 10px', fontSize: 11, color: '#fff',
            fontFamily: 'monospace', backdropFilter: 'blur(4px)',
          }}>
            {activeIndex + 1} / {total}
          </div>
        </div>

        {/* Controles ← → */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={prev}
            disabled={activeIndex === 0}
            style={{
              background: '#111827', border: '1px solid #1e293b', borderRadius: 8,
              color: activeIndex === 0 ? '#1e293b' : '#e2e8f0',
              padding: '8px 20px', cursor: activeIndex === 0 ? 'default' : 'pointer',
              fontSize: 16, lineHeight: 1,
            }}
          >←</button>

          <button
            onClick={next}
            disabled={activeIndex === total - 1}
            style={{
              background: '#111827', border: '1px solid #1e293b', borderRadius: 8,
              color: activeIndex === total - 1 ? '#1e293b' : '#e2e8f0',
              padding: '8px 20px', cursor: activeIndex === total - 1 ? 'default' : 'pointer',
              fontSize: 16, lineHeight: 1,
            }}
          >→</button>
        </div>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {slides.map((sl, i) => (
            <button
              key={i}
              onClick={() => onSlideChange(i)}
              style={{
                width: 44, height: 44, borderRadius: 6, overflow: 'hidden', padding: 0,
                border: `2px solid ${i === activeIndex ? '#00d4d4' : '#1e293b'}`,
                cursor: 'pointer', background: '#111118', flexShrink: 0,
              }}
            >
              {images[i] ? (
                <img src={images[i]} alt={`Thumb ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', background: '#111118',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#475569', fontFamily: 'monospace',
                }}>
                  {i + 1}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Info slide tipo */}
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', margin: 0 }}>
          {platform === 'linkedin' ? '💼' : '📸'} Slide {activeIndex + 1} — tipo:{' '}
          <span style={{ color: '#8B5CF6' }}>{slides[activeIndex]?.type}</span>
          {hasImage && (
            <> · <span
              style={{ color: '#00d4d4', cursor: 'pointer' }}
              onClick={() => setLightbox(true)}
            >ver a tamaño real ↗</span></>
          )}
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && hasImage && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: 24, cursor: 'zoom-out',
          }}
        >
          <img
            src={images[activeIndex]}
            alt={`Slide ${activeIndex + 1} full`}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#fff', fontSize: 18, borderRadius: 8,
              padding: '6px 14px', cursor: 'pointer',
            }}
          >✕</button>
        </div>
      )}
    </>
  );
}
