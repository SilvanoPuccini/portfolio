'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { StatusActions } from './StatusActions';
import type {
  PostPublication,
  PostPublicationListItem,
  PostPublicationStatus,
} from '@/lib/post-publications/types';

const eyebrow: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#00d4d4',
  margin: '0 0 12px',
};

const panel: React.CSSProperties = {
  marginTop: 20,
  padding: 20,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#111827',
};

/**
 * Texto en bruto del post: se lee, se edita y se guarda sin salir del detalle.
 *
 * La fila ya existe en la agenda con su slug y su fecha, así que acá solo se
 * carga el texto que falta. Los botones de estado están en el mismo panel a
 * propósito: preaprobar depende de que haya texto, y tenerlos separados
 * obligaba a volver al listado para ver si el botón se había habilitado.
 */
export function RawContentPanel({ item }: { item: PostPublication }) {
  const router = useRouter();
  const [content, setContent] = useState(item.raw_content ?? '');
  const [draft, setDraft] = useState(item.raw_content ?? '');
  const [editing, setEditing] = useState(!item.raw_content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chars = content.trim().length;

  // StatusActions trabaja con la fila del listado, que no trae el texto
  // entero. Se arma acá desde el contenido en pantalla para que el botón
  // reaccione apenas se guarda, sin esperar a que el servidor responda.
  const listItem: PostPublicationListItem = {
    ...item,
    has_content: chars > 0,
    content_chars: chars,
  };

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/posts-agenda/${item.post_slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'No se pudo guardar');
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (await patch({ raw_content: draft })) {
      setContent(draft);
      setEditing(false);
    }
  }

  function changeStatus(_slug: string, status: PostPublicationStatus) {
    patch({ status });
  }

  return (
    <>
      <div style={panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <p style={eyebrow}>Texto en bruto</p>
          {!editing && (
            <button
              className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
              style={s.btnGhost}
              onClick={() => {
                setDraft(content);
                setEditing(true);
              }}
            >
              Editar texto
            </button>
          )}
        </div>

        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pegá acá el texto del post. Se guarda en la agenda; el .mdx se sigue hardcodeando y deployando como siempre."
              style={{
                ...s.input,
                width: '100%',
                minHeight: 320,
                fontFamily: 'inherit',
                fontSize: 13,
                lineHeight: 1.7,
                resize: 'vertical',
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginTop: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ ...s.hint, marginTop: 0 }}>
                {draft.trim().length.toLocaleString('es-AR')} caracteres
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {content && (
                  <button
                    className="transition-colors hover:border-[#00d4d4] hover:text-[#00d4d4]"
                    style={s.btnGhost}
                    onClick={() => {
                      setDraft(content);
                      setEditing(false);
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                )}
                <button
                  className="transition-[filter] hover:brightness-110"
                  style={{ ...s.btn, ...(saving ? { opacity: 0.6, cursor: 'wait' } : {}) }}
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : 'Guardar texto'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
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
              {content}
            </pre>
            <p style={{ ...s.hint, marginTop: 12 }}>{chars.toLocaleString('es-AR')} caracteres guardados</p>
          </>
        )}

        {error && <p style={{ ...s.errorText, marginTop: 12 }}>{error}</p>}
      </div>

      <div style={panel}>
        <p style={eyebrow}>Estado</p>
        <StatusActions item={listItem} onChange={changeStatus} />
      </div>
    </>
  );
}
