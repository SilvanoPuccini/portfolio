import { c, tint } from './tokens';

/**
 * Pastilla de estado genérica. El color entra como rol semántico ya resuelto
 * por quien la usa, para que ningún módulo vuelva a definir su propia tabla de
 * colores por estado.
 */
export function StatusPill({ tone, label, title }: { tone: string; label: string; title?: string }) {
  return <span title={title} style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontFamily: 'monospace', padding: '3px 10px', borderRadius: 20,
    whiteSpace: 'nowrap',
    background: tint(tone, '1a'),
    color: tone === c.hairline ? c.textSoft : tone,
    border: `1px solid ${tint(tone, '40')}`,
  }}>
    <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
    {label}
  </span>;
}
