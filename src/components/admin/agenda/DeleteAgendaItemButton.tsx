'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export function DeleteAgendaItemButton({
  slug,
  title,
  onDeleted,
}: {
  slug: string;
  title: string;
  onDeleted?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts-agenda/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'No se pudo eliminar');

      if (onDeleted) {
        await onDeleted();
      } else {
        router.push('/admin/agenda');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="transition-colors hover:border-[#f87171] hover:text-[#f87171] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f87171]"
        style={{ ...s.btnGhost, color: '#f87171' }}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Eliminar
      </button>
      {confirming && (
        <ConfirmDialog
          title="Eliminar de la agenda"
          message={`“${title}” dejará de aparecer en la agenda y en el sitio. Se conserva el historial para que el MDX no vuelva a publicarse solo.`}
          confirmLabel={deleting ? 'Eliminando…' : 'Eliminar post'}
          tone="danger"
          loading={deleting}
          error={error}
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
        />
      )}
    </>
  );
}
