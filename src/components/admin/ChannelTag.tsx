import { c } from './tokens';
import type { AgendaChannel } from '@/lib/agenda/types';

/**
 * El canal se distingue por FORMA, no por color.
 *
 * El color ya está ocupado por el estado y por la falta de material; si también
 * codificara el canal, un mismo tono querría decir dos cosas y no se puede leer
 * ninguna. Blog es un rectángulo de esquinas rectas, LinkedIn una pastilla
 * redonda: la silueta se reconoce sin leer la etiqueta ni distinguir el tono.
 */
export function ChannelTag({ channel }: { channel: AgendaChannel }) {
  const blog = channel === 'blog';
  return <span aria-hidden style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    width: 58, height: 20, flexShrink: 0,
    fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
    borderRadius: blog ? 3 : 10,
    border: `1px solid ${blog ? 'rgba(226,232,240,.28)' : 'rgba(226,232,240,.16)'}`,
    background: blog ? 'rgba(226,232,240,.09)' : 'transparent',
    color: c.textSoft,
  }}>
    <span style={{
      width: 5, height: 5, flexShrink: 0,
      borderRadius: blog ? 0 : '50%',
      background: 'currentColor',
    }} />
    {blog ? 'BLOG' : 'IN'}
  </span>;
}
