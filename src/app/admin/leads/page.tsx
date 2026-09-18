'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { PIPELINE, DEAD_ENDS } from '@/lib/leads/pipeline';

type Lead = {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  tipo_proyecto: string | null;
  presupuesto_rango: string | null;
  plazo: string | null;
  estado: string;
};

/**
 * La lista sale del recorrido, no de una copia local. Cuando el pipeline gana
 * un estado, el filtro lo muestra sin que haya que acordarse de agregarlo acá.
 */
const ESTADOS = [...PIPELINE, ...DEAD_ENDS];

/** Verde es plata cobrada, cian en juego, ámbar hablando, rojo perdido. */
const ESTADO_COLORS: Record<string, string> = {
  nuevo: c.ready,
  llamada_agendada: c.published,
  no_show: c.late,
  'en conversación': c.incomplete,
  presupuestado: '#818cf8',
  contrato_enviado: '#818cf8',
  cerrado: c.published,
  facturado: c.published,
  entregado: c.published,
  descartado: c.hairline,
};

/** Etiquetas legibles: la base guarda snake_case, la pantalla no lo muestra. */
const ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  llamada_agendada: 'Llamada agendada',
  no_show: 'No apareció',
  'en conversación': 'En conversación',
  presupuestado: 'Propuesta enviada',
  contrato_enviado: 'Contrato enviado',
  cerrado: 'Ganado',
  facturado: 'Facturado',
  entregado: 'Entregado',
  descartado: 'Perdido',
};

const labelFor = (estado: string) => ESTADO_LABEL[estado] ?? estado;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const PER_PAGE = 10;

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/leads');
      if (!res.ok) { setError('Error al cargar datos (' + res.status + '). Intentá recargar o volvé a iniciar sesión.'); return; }
      const data = await res.json() as { leads: Lead[] };
      setLeads(data.leads ?? []);
    } catch (err) {
      console.error('leads load:', err);
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.estado === filter);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const countByEstado = (e: string) => leads.filter((l) => l.estado === e).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <p style={s.eyebrow}>CRM</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Leads</h1>
        </div>
        <p style={{ color: c.textDim, fontSize: 13 }}>
          {leads.length} total
          {ESTADOS.map((estado) => {
            const count = countByEstado(estado);
            return count > 0 ? ` · ${count} ${labelFor(estado).toLowerCase()}` : '';
          }).join('')}
        </p>
      </div>

      {error && <p style={{ ...s.errorText, margin: '0 0 16px' }}>{error}</p>}

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', ...ESTADOS].map((f) => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{
              ...s.btnGhost,
              color: filter === f ? c.ready : c.textDim,
              borderColor: filter === f ? c.ready : c.border,
            }}>
            {f === 'all' ? 'Todos' : labelFor(f)}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: c.textDim, fontSize: 13 }}>Cargando...</p>}

      {!loading && (
        <div style={s.card}>
          {filtered.length === 0
            ? <p style={{ color: c.textDim, fontSize: 13 }}>Sin leads.</p>
            : (
              <>
                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 0.8fr 0.9fr',
                  gap: 8, padding: '8px 0', borderBottom: '1px solid #1e293b',
                }}>
                  {['Fecha', 'Nombre', 'Tipo', 'Presupuesto', 'Plazo', 'Estado'].map((h) => (
                    <span key={h} style={{ ...s.label, marginBottom: 0 }}>{h}</span>
                  ))}
                </div>

                {/* Table rows */}
                {paginated.map((lead) => (
                  <div key={lead.id} onClick={() => router.push(`/admin/leads/${lead.id}`)}
                    style={{
                      display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 0.8fr 0.9fr',
                      gap: 8, padding: '10px 0', borderBottom: '1px solid #1e293b',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,212,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 12, color: c.textDim }}>{fmt(lead.created_at)}</span>
                    <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{lead.nombre}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{lead.tipo_proyecto ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{lead.presupuesto_rango ?? '—'}</span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{lead.plazo ?? '—'}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#0a0a14',
                      background: ESTADO_COLORS[lead.estado] ?? '#475569',
                      borderRadius: 20, padding: '3px 10px',
                      display: 'inline-block', textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}>
                      {labelFor(lead.estado)}
                    </span>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 4px' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ background: 'none', border: 'none', color: page === 1 ? c.hairline : c.textDim, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>
                      ← Ant.
                    </button>
                    <span style={{ fontSize: 11, color: c.textDim, fontFamily: 'monospace' }}>
                      {page} / {totalPages} · {filtered.length} total
                    </span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ background: 'none', border: 'none', color: page === totalPages ? c.hairline : c.textDim, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>
                      Sig. →
                    </button>
                  </div>
                )}
              </>
            )}
        </div>
      )}
    </div>
  );
}
