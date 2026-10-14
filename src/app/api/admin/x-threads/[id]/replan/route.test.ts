import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn() }));
vi.mock('@/lib/x/repository', () => ({ getThread: vi.fn() }));
vi.mock('@/lib/x/service', () => ({ replanThread: vi.fn() }));
import { isAuthorized } from '@/lib/admin-auth';
import { getThread } from '@/lib/x/repository';
import { replanThread } from '@/lib/x/service';
import { POST } from './route';

const exhausted = { id: 'row', status: 'error', last_error:
  'Los 4 ángulos del plan ya están cubiertos por hilos aprobados de la semana. Replanificá la semana o usá otro post.',
  published_ids: [], published_at: null };
const request = () => new NextRequest('http://localhost/api/admin/x-threads/row/replan', { method: 'POST' });
const context = () => ({ params: Promise.resolve({ id: 'row' }) });

describe('POST replan', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isAuthorized).mockReturnValue(true);
    vi.mocked(getThread).mockResolvedValue(exhausted as never);
  });
  it('refuses unauthorized requests without reading or changing data', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await POST(request(), context())).status).toBe(401);
    expect(getThread).not.toHaveBeenCalled();
    expect(replanThread).not.toHaveBeenCalled();
  });
  it('returns 404 for a missing row', async () => {
    vi.mocked(getThread).mockResolvedValue(null);
    expect((await POST(request(), context())).status).toBe(404);
    expect(replanThread).not.toHaveBeenCalled();
  });
  it.each([{ status: 'preaprobado' }, { published_at: '2026-10-01' },
    { published_ids: ['published'] }, { last_error: 'other error' }])('refuses ineligible rows: %j', async (overrides) => {
    vi.mocked(getThread).mockResolvedValue({ ...exhausted, ...overrides } as never);
    expect((await POST(request(), context())).status).toBe(409);
    expect(replanThread).not.toHaveBeenCalled();
  });
  it('returns the replanned row without publishing or generating', async () => {
    const updated = { ...exhausted, status: 'planificado', last_error: null };
    vi.mocked(replanThread).mockResolvedValue(updated as never);
    const response = await POST(request(), context());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ item: updated });
    expect(replanThread).toHaveBeenCalledExactlyOnceWith(exhausted);
  });
  it('reports planner failure without claiming success', async () => {
    vi.mocked(replanThread).mockRejectedValue(new Error('No material'));
    const response = await POST(request(), context());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'No material' });
  });
});
