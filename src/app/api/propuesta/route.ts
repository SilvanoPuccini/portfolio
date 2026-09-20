import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { recordProposalResponse, type ProposalAnswer } from '@/lib/leads/proposal-response';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * La respuesta del cliente a su propuesta.
 *
 * Es pública y sin sesión —el cliente no tiene cuenta—, así que la puerta es
 * el token: uno por envío, imposible de adivinar, y que deja de servir cuando
 * se manda una propuesta corregida.
 *
 * Es POST y no GET a propósito: los filtros de correo abren los links solos, y
 * una propuesta no puede aceptarse porque un antivirus pasó por encima.
 */

const ANSWERS: ProposalAnswer[] = ['aceptada', 'rechazada', 'pensando'];

/** Cuánto se puede postergar: más de un mes no es pensarlo, es un no. */
const MAX_REMIND_DAYS = 30;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`propuesta:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Demasiados intentos. Probá en un minuto.' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({})) as {
    token?: string; respuesta?: string; motivo?: string; recordar?: string;
  };

  const token = body.token?.trim();
  const respuesta = body.respuesta as ProposalAnswer | undefined;

  if (!token || !respuesta || !ANSWERS.includes(respuesta)) {
    return NextResponse.json({ error: 'Falta el token o la respuesta.' }, { status: 400 });
  }

  // La fecha la propone el cliente, así que se valida: una fecha pasada o a
  // dos años no es un recordatorio, es perder el lead en silencio.
  let remindAt: string | undefined;
  if (respuesta === 'pensando') {
    const asked = body.recordar ? Date.parse(body.recordar) : NaN;
    const max = Date.now() + MAX_REMIND_DAYS * 86_400_000;
    remindAt = Number.isNaN(asked) || asked < Date.now() || asked > max
      ? new Date(Date.now() + 7 * 86_400_000).toISOString()
      : new Date(asked).toISOString();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const result = await recordProposalResponse(
    token, respuesta, body.motivo, remindAt, `${siteUrl}/propuesta/${token}`,
  );

  if (!result.ok) {
    if (result.reason === 'already_answered') {
      return NextResponse.json({ yaRespondida: true, respuesta: result.answer }, { status: 409 });
    }
    if (result.reason === 'not_found') {
      return NextResponse.json({ error: 'Este link ya no está disponible.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'No se pudo registrar la respuesta.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, respuesta: result.answer, contrato: result.contrato });
}
