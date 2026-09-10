import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { deleteTweet, postTweet, whoAmI } from '@/lib/x/client';
import {
  isXReadPolicySkip,
  normalizeXDiagnosticError,
  type XVerificationStep,
} from '@/lib/x/diagnostics';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Comprueba de verdad que las credenciales pueden publicar.
 *
 * Leer con `GET /users/me` funciona igual con tokens de solo lectura, así que
 * no prueba nada sobre la escritura. El único chequeo honesto es publicar y
 * borrar: si el permiso quedó en Read only, falla acá y no en medio del primer
 * hilo real, con tres tweets ya colgados en la cuenta.
 *
 * El texto lleva la hora para no chocar con la regla de contenido duplicado de
 * X si se corre dos veces seguidas.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const steps: XVerificationStep[] = [];
  let readSkipped = false;

  let username: string | null = null;
  try {
    const me = await whoAmI();
    username = me.data.username;
    steps.push({ step: 'lectura', ok: true, detail: `@${username}` });
  } catch (reason) {
    const detail = normalizeXDiagnosticError(reason);
    readSkipped = isXReadPolicySkip(reason);
    steps.push(readSkipped
      ? { step: 'lectura', ok: true, skipped: true, detail }
      : { step: 'lectura', ok: false, detail });
    if (readSkipped) username = 'silvanopuccini';
  }

  let tweetId: string | null = null;
  try {
    tweetId = await postTweet(`Prueba de conexión ${new Date().toISOString()}`, null);
    steps.push({ step: 'escritura', ok: true, detail: tweetId });
  } catch (reason) {
    const detail = normalizeXDiagnosticError(reason);
    steps.push({ step: 'escritura', ok: false, detail });
    return NextResponse.json({
      ok: false, steps,
      hint: 'X rechazó la publicación. Revisá el estado de la app, sus permisos y las credenciales; si cambiaste permisos, regenerá el Access Token and Secret.',
    }, { status: 502 });
  }

  try {
    await deleteTweet(tweetId);
    steps.push({ step: 'borrado', ok: true });
  } catch (reason) {
    // Publicar salió bien, que es lo que se quería probar. Que no se pueda
    // borrar es raro pero no invalida el resultado: se avisa y listo.
    steps.push({ step: 'borrado', ok: false, detail: normalizeXDiagnosticError(reason) });
    return NextResponse.json({
      ok: true, steps, username,
      hint: `Publicar funciona, pero la prueba quedó en tu cuenta. Borrala a mano: el id es ${tweetId}.`,
    });
  }

  return NextResponse.json({
    ok: true, steps, username,
    hint: readSkipped
      ? 'Publicar y borrar funcionan. La lectura no está disponible por la política informada por X.'
      : steps[0].ok
        ? 'Leer, publicar y borrar funcionan. El circuito puede salir a producción.'
        : 'Publicar y borrar funcionan, pero la lectura falló. Revisá el detalle informado.',
  });
}
