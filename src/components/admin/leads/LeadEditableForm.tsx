'use client';

import { s } from '@/components/admin/AdminShell';

/**
 * Los campos editables de la ficha, con su botón de guardar.
 *
 * Los datos del cliente y el diagnóstico repetían el mismo bloque once veces:
 * un div, una etiqueta, un input y el mismo estilo copiado. Acá el patrón está
 * una sola vez y las pantallas describen QUÉ campos tienen, no cómo se dibuja
 * cada uno.
 */

export type LeadField =
  | { kind: 'text'; key: string; label: string; value: string; onChange: (value: string) => void }
  | { kind: 'textarea'; key: string; label: string; value: string; onChange: (value: string) => void; minHeight?: number }
  | { kind: 'select'; key: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }
  /** Un corte visual entre grupos de campos. No es un campo. */
  | { kind: 'divider'; key: string };

const textareaStyle = (minHeight: number) => ({
  ...s.input,
  minHeight,
  resize: 'vertical' as React.CSSProperties['resize'],
});

export function LeadEditableForm({ fields, onSave, saved, saveLabel = 'Guardar' }: {
  fields: LeadField[];
  onSave: () => void;
  saved: boolean;
  saveLabel?: string;
}) {
  return (
    <>
      {fields.map((field) => {
        if (field.kind === 'divider') return <div key={field.key} style={s.divider} />;

        const id = `lead-field-${field.key}`;
        return (
          <div key={field.key} style={{ marginBottom: 14 }}>
            <label htmlFor={id} style={s.label}>{field.label}</label>

            {field.kind === 'text' && (
              <input id={id} style={s.input} value={field.value}
                onChange={(event) => field.onChange(event.target.value)} />
            )}

            {field.kind === 'textarea' && (
              <textarea id={id} style={textareaStyle(field.minHeight ?? 80)} value={field.value}
                onChange={(event) => field.onChange(event.target.value)} />
            )}

            {field.kind === 'select' && (
              <select id={id} value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                style={{ ...s.input, appearance: 'auto' as React.CSSProperties['appearance'] }}>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" style={s.btn} onClick={onSave}>{saveLabel}</button>
        {saved && <p style={s.successText}>Guardado</p>}
      </div>
    </>
  );
}
