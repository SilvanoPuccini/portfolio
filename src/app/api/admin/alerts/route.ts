import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { collectAlerts } from '@/lib/admin/collect-alerts';

export const dynamic = 'force-dynamic';

/**
 * Lo que el tablero tiene que reclamarte hoy.
 *
 * Reglas, no modelo: siete consultas y una función pura. No hay cron detrás,
 * se calcula al abrir el panel — tampoco entraba uno, el plan Hobby de Vercel
 * topea en dos y el proyecto ya los usa para publicar el post y los hilos.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { alerts, incomplete } = await collectAlerts();

  return NextResponse.json({ alerts, ...(incomplete.length > 0 ? { incomplete } : {}) });
}
