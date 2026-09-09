import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/admin-auth', () => ({ isAuthorized: vi.fn().mockReturnValue(true) }));
vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { POST } from '@/app/api/admin/linkedin-posts/route';
import { PATCH } from '@/app/api/admin/linkedin-posts/[slug]/route';
import { PATCH as COMPLETE_PDF, POST as START_PDF } from '@/app/api/admin/linkedin-posts/[slug]/pdf/route';

function request(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/admin/linkedin-posts/test', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('LinkedIn editorial API', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(isAuthorized).mockReturnValue(true); });

  it('keeps mutations behind admin auth', async () => {
    vi.mocked(isAuthorized).mockReturnValue(false);
    expect((await POST(request('POST', {}))).status).toBe(401);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('validates Markdown imports before database access', async () => {
    expect((await POST(request('POST', { source_filename: '../bad.md' }))).status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('refuses a piece with neither title nor Markdown before touching the database', async () => {
    const response = await POST(request('POST', { slug: 'pieza', post_slug: 'articulo', slot: 'martes' }));
    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('reserves a piece from just a title, leaving text and PDF for later', async () => {
    const insertedRow = { slug: 'pieza', title: 'Pieza sin texto todavia', body: null };
    const single = vi.fn().mockResolvedValue({ data: insertedRow, error: null });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    const blog = vi.fn().mockResolvedValue({ data: { post_slug: 'articulo', scheduled_at: '2026-09-13T13:00:00.000Z' }, error: null });
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ maybeSingle: blog }) }) }),
      insert,
    });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as never);

    const response = await POST(request('POST', {
      slug: 'pieza', post_slug: 'articulo', slot: 'martes', title: 'Pieza sin texto todavia',
    }));

    expect(response.status).toBe(201);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Pieza sin texto todavia',
      body: null,
      source_markdown: null,
      source_filename: null,
    }));
  });

  it('does not allow skipping preapproval', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { slug: 'test', status: 'planificado', body: 'Ready copy', pre_approved_at: null, published_at: null }, error: null });
    const is = vi.fn().mockReturnValue({ maybeSingle });
    const eq = vi.fn().mockReturnValue({ is });
    const select = vi.fn().mockReturnValue({ eq });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: vi.fn().mockReturnValue({ select }) } as never);
    const response = await PATCH(request('PATCH', { status: 'publicado' }), { params: Promise.resolve({ slug: 'test' }) });
    expect(response.status).toBe(400);
  });

  it('rejects oversized or mislabeled PDFs before storage access', async () => {
    const response = await START_PDF(request('POST', { filename: 'slides.pdf', size: 10, content_type: 'text/plain' }), { params: Promise.resolve({ slug: 'test' }) });
    expect(response.status).toBe(400);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('removes an uploaded object when its PDF signature is invalid', async () => {
    const remove = vi.fn().mockResolvedValue({ error: null });
    const download = vi.fn().mockResolvedValue({ data: new Blob(['not-a-pdf'], { type: 'application/pdf' }), error: null });
    const pending = vi.fn().mockResolvedValue({ data: { pdf_storage_path: null, pdf_pending_path: 'linkedin/test/00000000-0000-0000-0000-000000000000.pdf' }, error: null });
    const selectChain = { eq: vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ maybeSingle: pending }) }) };
    const from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(selectChain), update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from, storage: { from: vi.fn().mockReturnValue({ download, remove }) } } as never);

    const response = await COMPLETE_PDF(request('PATCH', {
      filename: 'slides.pdf', size: 9, content_type: 'application/pdf',
      path: 'linkedin/test/00000000-0000-0000-0000-000000000000.pdf',
    }), { params: Promise.resolve({ slug: 'test' }) });

    expect(response.status).toBe(400);
    expect(remove).toHaveBeenCalledWith(['linkedin/test/00000000-0000-0000-0000-000000000000.pdf']);
  });
});
