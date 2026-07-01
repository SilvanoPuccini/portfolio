import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!session || !secret || !verifySessionToken(session, secret)) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }

  return NextResponse.json({ authed: true });
}
