import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { verifySessionToken } from '@/lib/admin-auth';
import { sendPostNewsletter } from '@/lib/newsletter/send-post-newsletter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Auth: bearer token OR signed session cookie (both timing-safe)
    const auth = req.headers.get('authorization');
    const notifySecret = process.env.NOTIFY_SECRET;
    let authorized = false;

    if (notifySecret && auth) {
      const provided = auth.replace(/^Bearer\s+/, '');
      const bufA = Buffer.from(provided);
      const bufB = Buffer.from(notifySecret);
      if (bufA.length === bufB.length) {
        authorized = timingSafeEqual(bufA, bufB);
      }
    }

    if (!authorized) {
      const cookie = req.cookies.get('admin_session')?.value;
      const sessionSecret = process.env.ADMIN_SESSION_SECRET;
      if (cookie && sessionSecret) {
        authorized = verifySessionToken(cookie, sessionSecret);
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { slug } = body as { slug: string };

    if (!slug) {
      return NextResponse.json({ error: 'slug es requerido.' }, { status: 400 });
    }

    const result = await sendPostNewsletter(slug);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.sent === 0) {
      return NextResponse.json({ message: 'No hay suscriptores activos.', sent: 0 });
    }

    return NextResponse.json({ success: true, sent: result.sent });
  } catch (err) {
    console.error('[notify] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado.' },
      { status: 500 },
    );
  }
}
