import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));
vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn() }));
vi.mock('@/lib/leads/acceso-cliente', () => ({ COOKIE_VERIFICADO: 'verified', tieneVerificacion: vi.fn() }));
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';
import { tieneVerificacion } from '@/lib/leads/acceso-cliente';
import { careHandler } from './http';
const rpc = vi.fn();
const id = '10000000-0000-4000-8000-000000000001';
function request(body?: unknown, origin='http://localhost') { return new NextRequest(`http://localhost/api/pedido/${id}/cuidado`, { method: body ? 'POST' : 'GET', headers: { origin, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
beforeEach(() => {
 vi.clearAllMocks(); vi.mocked(tieneVerificacion).mockReturnValue(true); vi.mocked(isAuthorized).mockReturnValue(true);
 rpc.mockResolvedValue({ data: { subscription: null, periods: [], requests: [] }, error: null });
 vi.mocked(getSupabaseAdmin).mockReturnValue({ rpc } as never);
});
it('denies unverified buyer before any database access', async () => {
 vi.mocked(tieneVerificacion).mockReturnValue(false);
 expect((await careHandler(request(), id, 'client')).status).toBe(401); expect(rpc).not.toHaveBeenCalled();
});
it('rejects cross-origin mutations and customer payment actions', async () => {
 const payload={ requestId: id, expectedVersion: 0, command: { action:'pay', periodId:id, amountUsd:40, reference:'ref1', paidOn:'2026-09-26' }};
 expect((await careHandler(request(payload,'https://attacker.test'),id,'admin')).status).toBe(403);
 expect((await careHandler(request(payload),id,'client')).status).toBe(400); expect(rpc).not.toHaveBeenCalled();
});
it('passes only validated client command and authenticated role to RPC', async () => {
 const command={ action:'accept', revision:'a'.repeat(64) };
 expect((await careHandler(request({ requestId:id, expectedVersion:1, command }),id,'client')).status).toBe(200);
 expect(rpc).toHaveBeenCalledWith('transition_order_care',expect.objectContaining({ p_actor:'client',p_order_id:id,p_command:command,p_expected_version:1 }));
});
it('returns stale revision conflict without leaking database details', async () => {
 rpc.mockResolvedValue({data:null,error:{message:'version_conflict private detail'}});
 const res=await careHandler(request({requestId:id,expectedVersion:1,command:{action:'cancel'}}),id,'client');
 expect(res.status).toBe(409); expect(JSON.stringify(await res.json())).not.toContain('private detail');
});
