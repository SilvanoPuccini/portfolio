import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import {
  FX_MARGIN, QUOTE_VALID_HOURS, ROUND_STEP, fetchUsdRate, type LocalCurrency,
} from '@/lib/leads/exchange-rate';

export const dynamic = 'force-dynamic';

const CURRENCIES: LocalCurrency[] = ['ARS', 'CLP'];

/** Las cotizaciones de hoy, con las mismas reglas que usa el pedido de pago. */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rates = await Promise.all(CURRENCIES.map(async (currency) => (
    (await fetchUsdRate(currency)) ?? { currency, unavailable: true }
  )));

  return NextResponse.json({ rates, margin: FX_MARGIN, roundStep: ROUND_STEP, validHours: QUOTE_VALID_HOURS });
}
