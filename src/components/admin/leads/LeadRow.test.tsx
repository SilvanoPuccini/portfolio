import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadRow } from './LeadRow';
import type { LeadRow as Row } from '@/lib/leads/row-summary';

const NOW = new Date('2026-09-18T15:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

function lead(overrides: Partial<Row> = {}): Row {
  return {
    id: 'l1',
    nombre: 'Ferrelon',
    estado: 'presupuestado',
    created_at: daysAgo(20),
    tipo_proyecto: 'catálogo + stock',
    monto_presupuestado: 4800,
    proposal_sent_at: daysAgo(2),
    contract_sent_at: null,
    fecha_llamada: null,
    ...overrides,
  };
}

const renderRow = (overrides: Partial<Row> = {}, onOpen = vi.fn()) => {
  render(<LeadRow lead={lead(overrides)} now={NOW} onOpen={onOpen} />);
  return onOpen;
};

describe('LeadRow', () => {
  it('muestra el nombre, el proyecto y el monto', () => {
    renderRow();
    expect(screen.getByText(/Ferrelon · catálogo \+ stock/)).toBeInTheDocument();
    expect(screen.getByText('$4.800')).toBeInTheDocument();
  });

  it('convierte el silencio en información', () => {
    renderRow({ proposal_sent_at: daysAgo(9) });
    // «hace 9 días» es un dato; «en conversación» no lo es.
    expect(screen.getByText(/9 días · sin respuesta/)).toBeInTheDocument();
  });

  it('ofrece el seguimiento cuando la propuesta se enfrió', () => {
    renderRow({ proposal_sent_at: daysAgo(9) });
    expect(screen.getByText('Seguimiento')).toBeInTheDocument();
  });

  it('no ofrece seguimiento si la propuesta es reciente', () => {
    renderRow({ proposal_sent_at: daysAgo(1) });
    expect(screen.queryByText('Seguimiento')).toBeNull();
  });

  it('a un no-show le ofrece reagendar', () => {
    renderRow({ estado: 'no_show' });
    expect(screen.getByText('Reagendar')).toBeInTheDocument();
  });

  it('a una venta cobrada le ofrece facturar', () => {
    // El botón depende de la fase: no es un «Abrir» repetido cinco veces.
    renderRow({ estado: 'cerrado' });
    expect(screen.getByText('Facturar')).toBeInTheDocument();
  });

  it('muestra un guión cuando todavía no hay monto', () => {
    renderRow({ monto_presupuestado: null });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('abre la ficha al hacer clic', () => {
    const onOpen = renderRow();
    fireEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('se puede abrir con el teclado', () => {
    const onOpen = renderRow();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('nombra la fila completa para un lector de pantalla', () => {
    renderRow({ proposal_sent_at: daysAgo(9) });
    expect(screen.getByRole('button', {
      name: /Ferrelon · Propuesta enviada · Propuesta hace 9 días · sin respuesta/,
    })).toBeInTheDocument();
  });
});
