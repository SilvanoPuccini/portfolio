'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { PublicEngagement, Reaction } from '@/lib/blog-engagement';

type Props = {
  slug: string;
  title: string;
  locale: 'es' | 'en';
  /** Vista de admin sobre un post que todavía no salió: no registra visita. */
  isPreview?: boolean;
};

const copy = {
  es: {
    prompt: '¿Te resultó útil?',
    like: 'Me gusta',
    dislike: 'No me gusta',
    share: 'Compartir',
    shared: 'Contenido compartido.',
    copied: 'Enlace copiado.',
    error: 'No se pudo actualizar. Inténtalo de nuevo.',
  },
  en: {
    prompt: 'Was this useful?',
    like: 'Like',
    dislike: 'Dislike',
    share: 'Share',
    shared: 'Content shared.',
    copied: 'Link copied.',
    error: 'Could not update. Please try again.',
  },
} as const;

function isPublicEngagement(value: unknown): value is PublicEngagement {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.likeCount === 'number'
    && (candidate.reaction === null || candidate.reaction === 'like' || candidate.reaction === 'dislike');
}

function optimisticState(
  current: PublicEngagement,
  nextReaction: Reaction | null,
): PublicEngagement {
  const wasLiked = current.reaction === 'like';
  const willBeLiked = nextReaction === 'like';
  return {
    reaction: nextReaction,
    likeCount: Math.max(0, current.likeCount + Number(willBeLiked) - Number(wasLiked)),
  };
}

export function PostEngagement({ slug, title, locale, isPreview = false }: Props) {
  const labels = copy[locale];
  const [engagement, setEngagement] = useState<PublicEngagement>({ likeCount: 0, reaction: null });
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const loadedRef = useRef(false);
  const endpoint = `/api/blog/${encodeURIComponent(slug)}/engagement`;

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadAndRecordView() {
      try {
        const response = await fetch(endpoint, { cache: 'no-store' });
        const payload: unknown = await response.json();
        const data = typeof payload === 'object' && payload !== null
          ? (payload as { data?: unknown }).data
          : undefined;
        if (!response.ok || !isPublicEngagement(data)) throw new Error('invalid engagement response');
        setEngagement(data);
        setReady(true);
        // Mirar el post desde el admin antes de que salga no es una visita.
        // El servidor rechaza igual la escritura de un post no publicado;
        // esto evita el 404 en cada preview.
        if (isPreview) return;
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view' }),
        });
      } catch {
        setReady(true);
        setStatus(labels.error);
      }
    }

    void loadAndRecordView();
  }, [endpoint, labels.error, isPreview]);

  async function updateReaction(selected: Reaction) {
    if (saving) return;
    const previous = engagement;
    const nextReaction = previous.reaction === selected ? null : selected;
    setEngagement(optimisticState(previous, nextReaction));
    setSaving(true);
    setStatus('');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reaction', reaction: nextReaction }),
      });
      const payload: unknown = await response.json();
      const data = typeof payload === 'object' && payload !== null
        ? (payload as { data?: unknown }).data
        : undefined;
      if (!response.ok || !isPublicEngagement(data)) throw new Error('invalid engagement response');
      setEngagement(data);
    } catch {
      setEngagement(previous);
      setStatus(labels.error);
    } finally {
      setSaving(false);
    }
  }

  async function recordShare() {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title, url });
        setStatus(labels.shared);
      } else {
        await navigator.clipboard.writeText(url);
        setStatus(labels.copied);
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'share' }),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus(labels.error);
    }
  }

  const buttonClass = 'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 disabled:cursor-not-allowed disabled:opacity-60';
  const selectedClass = 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary';
  const idleClass = 'border-outline-ghost/15 text-text-secondary hover:border-outline-ghost/30 hover:text-text-primary';

  return (
    <section
      aria-label={labels.prompt}
      className="mt-14 border-y border-outline-ghost/10 py-5 sm:flex sm:items-center sm:justify-between"
    >
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary sm:mb-0">
        {labels.prompt}
      </p>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={engagement.reaction === 'like'}
            aria-label={`${labels.like}: ${engagement.likeCount}`}
            disabled={!ready || saving}
            onClick={() => void updateReaction('like')}
            className={`${buttonClass} ${engagement.reaction === 'like' ? selectedClass : idleClass}`}
          >
            <ThumbsUp aria-hidden size={16} strokeWidth={1.8} />
            <span>{labels.like}</span>
            <span className="font-mono tabular-nums" aria-hidden>{engagement.likeCount}</span>
          </button>
          <button
            type="button"
            aria-pressed={engagement.reaction === 'dislike'}
            disabled={!ready || saving}
            onClick={() => void updateReaction('dislike')}
            className={`${buttonClass} ${engagement.reaction === 'dislike' ? selectedClass : idleClass}`}
          >
            <ThumbsDown aria-hidden size={16} strokeWidth={1.8} />
            <span>{labels.dislike}</span>
          </button>
          <button type="button" onClick={() => void recordShare()} className={`${buttonClass} ${idleClass}`}>
            <Share2 aria-hidden size={16} strokeWidth={1.8} />
            <span>{labels.share}</span>
          </button>
        </div>
        <p
          className="mt-2 min-h-4 text-right font-mono text-[11px] text-text-tertiary"
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      </div>
    </section>
  );
}
