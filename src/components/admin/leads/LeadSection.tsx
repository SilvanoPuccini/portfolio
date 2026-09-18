'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { c, tint } from '@/components/admin/tokens';

/**
 * Una sección de la ficha, plegable.
 *
 * Envuelve el contenido que ya existía: no lo reescribe. Lo único que aporta
 * es decidir cuál viene abierta según la fase de la venta, y dejar que
 * cualquiera se abra con un clic.
 *
 * El contenido se monta siempre y se oculta con `hidden`: desmontarlo perdería
 * lo que haya a medio escribir en la calculadora o en el diagnóstico cada vez
 * que se pliega la sección.
 */
export function LeadSection({ title, defaultOpen, hint, children }: {
  title: string;
  defaultOpen: boolean;
  /** Una línea que dice por qué esta sección importa ahora. */
  hint?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Al cambiar la fase (se cobró, se mandó la propuesta) la ficha reacomoda
  // qué está abierto, igual que cuando se carga.
  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);

  return (
    <section style={{
      background: c.surface,
      border: `1px solid ${defaultOpen ? tint(c.ready, '40') : c.border}`,
      borderRadius: 12, marginBottom: 12, overflow: 'hidden',
    }}>
      <button type="button" onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="transition-colors hover:bg-[rgba(255,255,255,0.02)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d4d4]"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 18px', background: 'transparent', border: 0,
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}>
        <span aria-hidden style={{
          color: c.textDim, fontSize: 11, flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s',
        }}>▶</span>

        <span style={{ fontSize: 15, fontWeight: 600, color: c.text }}>{title}</span>

        {defaultOpen && (
          <span style={{
            fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.14em',
            textTransform: 'uppercase', fontWeight: 700,
            color: c.ready, background: tint(c.ready, '1a'),
            padding: '2px 7px', borderRadius: 4,
          }}>Ahora</span>
        )}

        {hint && !open && (
          <span style={{
            fontSize: 11.5, color: c.textDim, marginLeft: 'auto',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{hint}</span>
        )}
      </button>

      <div hidden={!open} style={{ padding: '0 18px 18px' }}>{children}</div>
    </section>
  );
}
