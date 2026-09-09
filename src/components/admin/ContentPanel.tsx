'use client';

import { useEffect, useRef, useState } from 'react';
import { CopyIconButton, ConfirmIconButton, CrossIcon } from './IconButton';
import { MarkdownDrop } from './MarkdownDrop';
import { c } from './tokens';

/**
 * El texto de una pieza, editable en el lugar.
 *
 * No hay botón "modificar" ni botón "guardar": el texto se edita donde se lee
 * y se guarda al salir del campo. Borrarlo es la cruz, con la confirmación en
 * el mismo lugar. Cargarlo de nuevo es arrastrar el .md.
 */
export function ContentPanel({ value, title, onSave, onAttachMarkdown }: {
  value: string;
  title: string;
  onSave: (text: string) => Promise<boolean>;
  onAttachMarkdown: (markdown: string, filename: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const flash = useRef<ReturnType<typeof setTimeout> | null>(null);

  // El servidor manda: si el valor cambió afuera (adjuntar un .md, recargar),
  // el borrador local se alinea en vez de quedar pisando lo nuevo.
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => () => { if (flash.current) clearTimeout(flash.current); }, []);

  function confirmSaved() {
    setSaved(true);
    if (flash.current) clearTimeout(flash.current);
    flash.current = setTimeout(() => setSaved(false), 1800);
  }

  async function commit(next: string) {
    if (next === value) return;
    setSaving(true);
    const ok = await onSave(next);
    setSaving(false);
    if (ok) confirmSaved(); else setDraft(value);
  }

  const chars = draft.trim().length;
  return <section style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 16 }}>
    <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.textDim }}>
        {title}
      </span>
      <span aria-live="polite" style={{ fontFamily: 'monospace', fontSize: 10, color: saved ? c.published : c.textDim }}>
        {saving ? 'guardando…' : saved ? '✓ guardado' : chars ? `${chars.toLocaleString('es-AR')} car.` : 'vacío'}
      </span>
      <span style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
        <CopyIconButton text={draft} label="Copiar texto" />
        <MarkdownDrop compact label=".md" busy={saving}
          onFile={async (markdown, filename) => { setSaving(true); await onAttachMarkdown(markdown, filename); setSaving(false); confirmSaved(); }} />
        <ConfirmIconButton label="Borrar el texto" question="¿Borrar el texto?"
          disabled={!chars}
          onConfirm={() => commit('')}
        ><CrossIcon /></ConfirmIconButton>
      </span>
    </header>

    {chars === 0 && <div style={{ marginBottom: 10 }}>
      <MarkdownDrop busy={saving} label="Arrastrá el .md o hacé clic para elegirlo"
        onFile={async (markdown, filename) => { setSaving(true); await onAttachMarkdown(markdown, filename); setSaving(false); confirmSaved(); }} />
    </div>}

    <textarea aria-label={title} value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => commit(draft)}
      placeholder="Escribí acá, o adjuntá el .md y se convierte a texto."
      style={{
        width: '100%', boxSizing: 'border-box', minHeight: chars ? 300 : 90,
        background: c.page, border: `1px solid ${c.border}`, borderRadius: 8,
        padding: 13, color: c.text, fontSize: 13, lineHeight: 1.7,
        fontFamily: 'inherit', resize: 'vertical', outline: 'none',
      }}
      onFocus={(event) => { event.currentTarget.style.borderColor = c.ready; }}
      onBlurCapture={(event) => { event.currentTarget.style.borderColor = c.border; }}
    />
    <p style={{ margin: '7px 0 0', fontSize: 11, color: c.textDim }}>
      Se guarda solo al salir del campo.
    </p>
    {saved && <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} role="status">Texto guardado</span>}
  </section>;
}
