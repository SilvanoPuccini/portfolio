import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value;
  const secret = process.env.NOTIFY_SECRET;

  if (!session || !secret || session !== secret) {
    return NextResponse.json({ authed: false }, { status: 401 });
  }

  return NextResponse.json({ authed: true });
}
