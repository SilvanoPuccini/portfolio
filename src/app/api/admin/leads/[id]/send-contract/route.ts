import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { sendContractToLead } from '@/lib/leads/send-contract';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, number> = {
  lead_not_found: 404,
  no_document: 500,
  email_failed: 502,
  db_failed: 500,
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const result = await sendContractToLead(id);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.detail ?? result.reason },
      { status: STATUS[result.reason] ?? 500 },
    );
  }

  return NextResponse.json({ success: true, ...(result.estado ? { estado: result.estado } : {}) });
}
