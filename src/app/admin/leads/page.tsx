'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { LeadRow } from '@/components/admin/leads/LeadRow';
import { DEAD_ENDS, PIPELINE, labelForState } from '@/lib/leads/pipeline';
import { pipelineValue, rowSummary, type LeadRow as Lead } from '@/lib/leads/row-summary';

/**
 * La lista sale del recorrido, no de una copia local: cuando el pipeline gana
 * un estado, el filtro lo muestra sin que haya que acordarse de agregarlo.
 */
const ESTADOS = [...PIPELINE, ...DEAD_ENDS];

const PER_PAGE = 12;

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('abiertas');
  const [page, setPage] = useState(1);

  // Un solo reloj para toda la tabla: si cada fila leyera el suyo, dos filas
  // iguales podrían mostrar antigüedades distintas.
  const now = useMemo(() => new Date(), [leads]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/leads');
      if (!res.ok) { setError(`Error al cargar datos (${res.status}). Intentá recargar o volvé a iniciar sesión.`); return; }
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

  /** Lo que todavía se puede ganar o perder: ni cobrado ni descartado. */
  const open = useMemo(
    () => leads.filter((lead) => lead.estado !== 'descartado' && lead.estado !== 'entregado'),
    [leads],
  );

  const needsAction = useMemo(
    () => open.filter((lead) => rowSummary(lead, now).risk),
    [open, now],
  );

  const filtered = useMemo(() => {
    if (filter === 'abiertas') return open;
    if (filter === 'reclaman') return needsAction;
    if (filter === 'all') return leads;
    return leads.filter((lead) => lead.estado === filter);
  }, [filter, leads, open, needsAction]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const money = pipelineValue(open);

  const chip = (value: string, label: string, tone: string = c.ready) => (
    <button key={value} type="button" onClick={() => { setFilter(value); setPage(1); }}
      style={{
        ...s.btnGhost,
        color: filter === value ? tone : c.textDim,
        borderColor: filter === value ? tone : c.border,
      }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <p style={s.eyebrow}>Vender</p>
          <h1 style={{ ...s.heading, marginBottom: 0, fontSize: 24 }}>Leads</h1>
        </div>
        {/* El encabezado responde tres preguntas de negocio, no cuenta filas. */}
        <p style={{ fontSize: 13, color: c.textDim, margin: 0 }}>
          <strong style={{ color: c.text }}>{open.length}</strong> en juego
          {money > 0 && <> · <strong style={{ color: c.text, fontFamily: 'monospace' }}>${money.toLocaleString('es-AR')}</strong> en la mesa</>}
          {needsAction.length > 0 && <> · <strong style={{ color: c.late }}>{needsAction.length}</strong> {needsAction.length === 1 ? 'reclama acción' : 'reclaman acción'}</>}
        </p>
      </div>

      {error && <p style={{ ...s.errorText, margin: '0 0 16px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {chip('abiertas', 'En juego')}
        {needsAction.length > 0 && chip('reclaman', `Reclaman acción · ${needsAction.length}`, c.late)}
        {chip('all', 'Todas')}
        <span aria-hidden style={{ width: 1, background: c.border, margin: '2px 4px' }} />
        {ESTADOS.filter((estado) => leads.some((lead) => lead.estado === estado))
          .map((estado) => chip(estado, labelForState(estado)))}
      </div>

      {loading && <p style={{ color: c.textDim, fontSize: 13 }}>Cargando...</p>}

      {!loading && (
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <p style={{ margin: 0, padding: 20, fontSize: 13, color: c.textDim }}>
              {filter === 'reclaman'
                ? 'Nada reclama acción. Ninguna propuesta enfriándose, ningún lead esperando.'
                : 'Sin leads con este filtro.'}
            </p>
          ) : (
            <>
              {paginated.map((lead) => (
                <LeadRow key={lead.id} lead={lead} now={now}
                  onOpen={() => router.push(`/admin/leads/${lead.id}`)} />
              ))}

              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px' }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ background: 'none', border: 0, fontFamily: 'inherit', color: page === 1 ? c.hairline : c.textDim, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>
                    ← Ant.
                  </button>
                  <span style={{ fontSize: 11, color: c.textDim, fontFamily: 'monospace' }}>
                    {page} / {totalPages} · {filtered.length} total
                  </span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ background: 'none', border: 0, fontFamily: 'inherit', color: page === totalPages ? c.hairline : c.textDim, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, padding: '2px 6px' }}>
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
