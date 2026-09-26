import { NextRequest } from 'next/server';
import { careHandler } from '@/lib/care/http';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return careHandler(req, (await params).id, 'admin');
}
export const POST = GET;
