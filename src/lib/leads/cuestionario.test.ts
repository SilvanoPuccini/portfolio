import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { asegurarCuestionario } from './cuestionario';

const insert = vi.fn();

function supabase(existente: unknown) {
  insert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { token: 'tok-nuevo' }, error: null }),
    }),
  });

  vi.mocked(getSupabaseAdmin).mockReturnValue({
    from: vi.fn(() => ({
      insert,
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: existente, error: null }),
            }),
          }),
        }),
      }),
    })),
  } as never);
}

beforeEach(() => vi.clearAllMocks());

describe('asegurarCuestionario', () => {
  it('reusa el que ya existe: dos links distintos confunden al cliente', async () => {
    supabase({ token: 'tok-viejo', completed_at: null });

    expect(await asegurarCuestionario('lead-1')).toBe('tok-viejo');
    expect(insert).not.toHaveBeenCalled();
  });

  it('crea uno si no hay', async () => {
    supabase(null);

    expect(await asegurarCuestionario('lead-1')).toBe('tok-nuevo');
    expect(insert).toHaveBeenCalledWith({ lead_id: 'lead-1' });
  });

  it('si ya lo contestó no devuelve nada: no hay nada que pedirle', async () => {
    supabase({ token: 'tok-viejo', completed_at: '2026-09-22T10:00:00Z' });

    expect(await asegurarCuestionario('lead-1')).toBeNull();
    expect(insert).not.toHaveBeenCalled();
  });
});
