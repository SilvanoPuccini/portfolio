'use client';

import { useState, useEffect } from 'react';
import { s } from '@/components/admin/AdminShell';

interface Slide {
  type: string;
  headline: string;
  body: string;
}

interface SlideEditorProps {
  slide: Slide;
  slideIndex: number;
  platform: 'linkedin' | 'instagram';
  distributionId: string;
  onSave: (idx: number, updated: Slide) => void;
}

// Límites según plataforma y campo
const LIMITS = {
  linkedin:  { headline: 60,  body: 1200 },
  instagram: { headline: 40,  body: 600  },
};

function charColor(count: number, limit: number): string {
  const pct = count / limit;
  if (pct < 0.7) return '#4ade80';
  if (pct < 0.9) return '#facc15';
  return '#f87171';
}

const AUTH = () => ({ Authorization: `Bearer ${process.env.NEXT_PUBLIC_NOTIFY_SECRET}` });

export default function SlideEditor({
  slide,
  slideIndex,
  platform,
  distributionId,
  onSave,
}: SlideEditorProps) {
  const [headline, setHeadline] = useState(slide.headline);
  const [body, setBody] = useState(slide.body);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincroniza cuando cambia el slide activo
  useEffect(() => {
    setHeadline(slide.headline);
    setBody(slide.body);
    setSaved(false);
  }, [slide]);

  const isDirty = headline !== slide.headline || body !== slide.body;
  const limits = LIMITS[platform];

  async function handleSave() {
    setSaving(true);
    const updated: Slide = { ...slide, headline, body };

    // Necesitamos recuperar el contenido completo, patchear el slide, y guardarlo
    const res = await fetch(`/api/admin/distributions/${distributionId}`, { headers: AUTH() });
    const data = await res.json() as { distribution: Record<string, unknown> };
    const dist = data.distribution;

    const field = platform === 'linkedin' ? 'linkedin_content' : 'instagram_content';
    const content = dist[field] as { slides: Slide[]; caption: string; hashtags: string[] };
    const newSlides = [...content.slides];
    newSlides[slideIndex] = updated;

    await fetch(`/api/admin/distributions/${distributionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...AUTH() },
      body: JSON.stringify({ [field]: { ...content, slides: newSlides } }),
    });

    onSave(slideIndex, updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    await fetch(`/api/admin/distributions/${distributionId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...AUTH() },
      body: JSON.stringify({ scope: 'slide', platform, slide_index: slideIndex }),
    });

    // Recarga el slide desde la API
    const res = await fetch(`/api/admin/distributions/${distributionId}`, { headers: AUTH() });
    const data = await res.json() as { distribution: Record<string, unknown> };
    const field = platform === 'linkedin' ? 'linkedin_content' : 'instagram_content';
    const content = data.distribution[field] as { slides: Slide[] };
    const fresh = content.slides[slideIndex];
    if (fresh) {
      setHeadline(fresh.headline);
      setBody(fresh.body);
      onSave(slideIndex, fresh);
    }
    setRegenerating(false);
  }

  function handleDiscard() {
    setHeadline(slide.headline);
    setBody(slide.body);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={s.label}>Headline</label>
          <span style={{
            fontFamily: 'monospace', fontSize: 11,
            color: charColor(headline.length, limits.headline),
          }}>
            {headline.length} / {limits.headline}
          </span>
        </div>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={limits.headline + 20}
          style={s.input}
        />
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={s.label}>Body</label>
          <span style={{
            fontFamily: 'monospace', fontSize: 11,
            color: charColor(body.length, limits.body),
          }}>
            {body.length} / {limits.body}
          </span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          style={{
            ...s.input,
            resize: 'vertical',
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{
            ...s.btn,
            opacity: !isDirty || saving ? 0.5 : 1,
            fontSize: 12, padding: '8px 16px',
          }}
        >
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
        </button>

        {isDirty && (
          <button onClick={handleDiscard} style={{ ...s.btnGhost, fontSize: 12, padding: '8px 14px' }}>
            Descartar
          </button>
        )}

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          style={{
            ...s.btnGhost, fontSize: 12, padding: '8px 14px',
            color: regenerating ? '#475569' : '#8B5CF6',
            borderColor: regenerating ? '#1e293b' : '#8B5CF620',
            opacity: regenerating ? 0.6 : 1,
          }}
        >
          {regenerating ? 'Regenerando...' : '✦ Regenerar con IA'}
        </button>
      </div>

      {/* Tipo del slide */}
      <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#334155', margin: 0 }}>
        tipo: <span style={{ color: '#475569' }}>{slide.type}</span>
        {' · '}slide {slideIndex + 1}
      </p>
    </div>
  );
}
