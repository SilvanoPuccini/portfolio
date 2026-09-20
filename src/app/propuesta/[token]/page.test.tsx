import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('next/navigation', () => ({ notFound: vi.fn(() => { throw new Error('NEXT_NOT_FOUND'); }) }));

import { getSupabaseAdmin } from '@/lib/supabase';
import PropuestaPage from './page';

const DOC = {
  cliente: 'Ferrelon',
  problema: 'Pierden pedidos porque el stock vive en dos cabezas',
  solucion: 'Catálogo con stock en vivo',
  incluye: [
    { titulo: 'Catálogo de productos', detalle: 'Resuelve el problema del stock', horas: 24 },
    { titulo: 'Pagos online', horas: 16 },
  ],
  masAdelante: ['App para celular'],
  inversion: { total: 4800, sena: 2400, saldo: 2400, pct: 50 },
  mantenimiento: 60,
  horas: 120,
  emitidoEl: '2026-09-21T15:00:00.000Z',
};

function supabase(row: Record<string, unknown> | null) {
  const from = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) }),
    }),
  });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);
}

const view = async (token = 'tok-1') => render(
  await PropuestaPage({ params: Promise.resolve({ token }) }),
);

describe('la propuesta que ve el cliente', () => {
  beforeEach(() => vi.clearAllMocks());

  it('muestra el diagnóstico, lo que incluye y la inversión', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: null });

    await view();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Ferrelon');
    expect(screen.getByText(/Pierden pedidos/)).toBeTruthy();
    expect(screen.getByText('Catálogo de productos')).toBeTruthy();
    // El total está en el bloque de inversión y repetido en la barra fija.
    expect(screen.getAllByText('USD 4.800').length).toBeGreaterThan(0);
    // Con una seña del 50 % la seña y el saldo son el mismo número: tienen
    // que estar los dos, para que el cliente sepa qué paga y cuándo.
    expect(screen.getAllByText('USD 2.400')).toHaveLength(2);
  });

  it('muestra el mantenimiento mensual cuando se acordó', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: null });

    await view();

    expect(screen.getByText(/Mantenimiento: USD 60 por mes/)).toBeTruthy();
  });

  it('lo oculta cuando no hay mantenimiento', async () => {
    supabase({ propuesta_snapshot: { ...DOC, mantenimiento: null }, propuesta_respuesta: null });

    await view();

    expect(screen.queryByText(/Mantenimiento:/)).toBeNull();
  });

  it('termina en la decisión, con las dos salidas', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: null });

    await view();

    expect(screen.getByRole('button', { name: /Acepto, mandame el contrato/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /No por ahora/i })).toBeTruthy();
  });

  it('si ya respondió no vuelve a ofrecerle decidir', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: 'aceptada' });

    await view();

    expect(screen.queryByRole('button', { name: /Acepto/i })).toBeNull();
    expect(screen.getByText(/te llega el contrato para firmar/i)).toBeTruthy();
  });

  it('un link que no existe no dice nada de nadie', async () => {
    supabase(null);

    await expect(view('inventado')).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('una propuesta sin foto guardada tampoco se muestra', async () => {
    supabase({ propuesta_snapshot: null, propuesta_respuesta: null });

    await expect(view()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('deja el precio y la decisión a mano sin scrollear', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: null });

    await view();

    expect(screen.getByRole('link', { name: /Decidir/i })).toHaveAttribute('href', '#decidir');
  });

  it('una vez aceptada, la barra de decidir desaparece', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: 'aceptada' });

    await view();

    expect(screen.queryByRole('link', { name: /Decidir/i })).toBeNull();
  });

  it('muestra los pasos que vienen después de aceptar', async () => {
    supabase({ propuesta_snapshot: DOC, propuesta_respuesta: null });

    await view();

    expect(screen.getByText('Firmar')).toBeTruthy();
    expect(screen.getByText('Pagar la seña')).toBeTruthy();
  });
});
