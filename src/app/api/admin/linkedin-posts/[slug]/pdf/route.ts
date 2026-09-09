import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { linkedinSlugSchema, pdfUploadCompleteSchema, pdfUploadSchema } from '@/lib/linkedin-posts/schemas';

export const dynamic = 'force-dynamic';
const BUCKET = 'linkedin-originals';

async function validSlug(params: Promise<{ slug: string }>) {
  const { slug } = await params;
  return linkedinSlugSchema.safeParse(slug).success ? slug : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const slug = await validSlug(params);
  if (!slug) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  const parsed = pdfUploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'PDF inválido' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: item } = await db.from('linkedin_posts').select('slug, pdf_pending_path').eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (item.pdf_pending_path) await db.storage.from(BUCKET).remove([item.pdf_pending_path]);
  const path = `linkedin/${slug}/${randomUUID()}.pdf`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'No se pudo iniciar la subida' }, { status: 500 });
  const { error: pendingError } = await db.from('linkedin_posts').update({
    pdf_pending_path: path,
    pdf_pending_at: new Date().toISOString(),
  }).eq('slug', slug).is('deleted_at', null);
  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const slug = await validSlug(params);
  if (!slug) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  const parsed = pdfUploadCompleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.path.startsWith(`linkedin/${slug}/`)) {
    return NextResponse.json({ error: 'Referencia de PDF inválida' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const storage = db.storage.from(BUCKET);
  const { data: current } = await db.from('linkedin_posts').select('pdf_storage_path, pdf_pending_path')
    .eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (!current || current.pdf_pending_path !== parsed.data.path) {
    return NextResponse.json({ error: 'La subida no coincide con la operación pendiente' }, { status: 409 });
  }
  const { data: file, error: downloadError } = await storage.download(parsed.data.path);
  if (downloadError || !file) {
    await storage.remove([parsed.data.path]);
    await db.from('linkedin_posts').update({ pdf_pending_path: null, pdf_pending_at: null }).eq('slug', slug);
    return NextResponse.json({ error: 'No se pudo verificar el PDF subido' }, { status: 400 });
  }
  const signature = Buffer.from(await file.slice(0, 5).arrayBuffer()).toString('ascii');
  if (signature !== '%PDF-' || file.size !== parsed.data.size || file.size > 25 * 1024 * 1024) {
    await storage.remove([parsed.data.path]);
    await db.from('linkedin_posts').update({ pdf_pending_path: null, pdf_pending_at: null }).eq('slug', slug);
    return NextResponse.json({ error: 'El archivo subido no es el PDF declarado' }, { status: 400 });
  }
  const { error } = await db.from('linkedin_posts').update({
    pdf_storage_path: parsed.data.path,
    pdf_original_name: parsed.data.filename,
    pdf_size_bytes: file.size,
    pdf_mime_type: 'application/pdf',
    pdf_pending_path: null,
    pdf_pending_at: null,
    updated_at: new Date().toISOString(),
  }).eq('slug', slug).is('deleted_at', null);
  if (error) {
    await storage.remove([parsed.data.path]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (current.pdf_storage_path && current.pdf_storage_path !== parsed.data.path) {
    await storage.remove([current.pdf_storage_path]);
  }
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const slug = await validSlug(params);
  if (!slug) return NextResponse.json({ error: 'Slug inválido' }, { status: 400 });
  const db = getSupabaseAdmin();
  const { data: item } = await db.from('linkedin_posts').select('pdf_storage_path, carousel_pdf_url')
    .eq('slug', slug).is('deleted_at', null).maybeSingle();
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  if (!item.pdf_storage_path) {
    if (item.carousel_pdf_url) return NextResponse.json({ url: item.carousel_pdf_url });
    return NextResponse.json({ error: 'Este contenido no tiene PDF' }, { status: 404 });
  }
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(item.pdf_storage_path, 60);
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'No se pudo abrir el PDF' }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
