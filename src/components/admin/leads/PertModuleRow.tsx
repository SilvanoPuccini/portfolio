'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { pertHours, type PertRow } from '@/lib/leads/types';

/**
 * Una fila de la estimación: el módulo, si entra en el presupuesto, y sus tres
 * escenarios de horas. Sale de la ficha porque la usa la calculadora, no la
 * pantalla entera.
 */
export function PertModuleRow({
  row,
  onChange,
}: {
  row: PertRow;
  onChange: (slug: string, field: keyof Pick<PertRow, 'o' | 'm' | 'p' | 'selected'>, value: number | boolean) => void;
}) {
  const pert = pertHours(row.o, row.m, row.p);

  const numInput: React.CSSProperties = {
    ...s.input,
    width: 64,
    padding: '6px 8px',
    textAlign: 'center',
    fontSize: 13,
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
      opacity: row.selected ? 1 : 0.4,
      padding: '8px 10px',
      background: row.selected ? 'rgba(0,212,212,0.04)' : 'transparent',
      borderRadius: 8,
      transition: 'opacity 0.15s',
    }}>
      <input
        type="checkbox"
        checked={row.selected}
        onChange={(e) => onChange(row.slug, 'selected', e.target.checked)}
        style={{ accentColor: '#00d4d4' }}
      />
      <span style={{ fontSize: 13, color: '#e2e8f0', width: 180, flexShrink: 0 }}>
        {row.label}
      </span>
      <input type="number" min={0} value={row.o} style={numInput}
        onChange={(e) => onChange(row.slug, 'o', Number(e.target.value) || 0)} title="Optimista" />
      <input type="number" min={0} value={row.m} style={numInput}
        onChange={(e) => onChange(row.slug, 'm', Number(e.target.value) || 0)} title="Más probable" />
      <input type="number" min={0} value={row.p} style={numInput}
        onChange={(e) => onChange(row.slug, 'p', Number(e.target.value) || 0)} title="Pesimista" />
      <span style={{ fontSize: 12, color: c.textDim, width: 52, textAlign: 'right', fontFamily: 'monospace' }}>
        {row.selected ? `${pert.toFixed(1)}h` : '—'}
      </span>
    </div>
  );
}
