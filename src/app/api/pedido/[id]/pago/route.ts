import { randomUUID } from 'crypto';
import { NextRequest, NextResponse, after } from 'next/server';

import { leerComprobante } from '@/lib/leads/leer-comprobante';
import { paymentInstructionsFor } from '@/lib/leads/payment-instructions';

import {
  motivoLegible, nombreVisible, revisarComprobante, rutaDelComprobante, tipoReal,
  type TipoComprobante,
} from '@/lib/leads/comprobante';
import { asuntoDeAviso, avisoAdmin } from '@/lib/email-templates/aviso-admin';
import { quoteFor } from '@/lib/leads/exchange-rate';
import { rateLimit } from '@/lib/rate-limit';
import { sendCrmEmail } from '@/lib/resend';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * «Ya transferí»: el cliente avisa que pagó.
 *
 * No confirma el cobro, lo informa. La plata se confirma cuando Silvano la ve
 * en la cuenta, y hasta entonces el pedido queda en un estado intermedio que
 * los dos entienden: el cliente sabe que su aviso llegó y Silvano sabe que
 * tiene algo que verificar.
 *
 * Sin esto, el que transfería quedaba sin saber si hacía falta avisar, y la
 * mitad avisaba por otro canal.
 *
 * Puede venir con el comprobante adjunto, y ahí el aviso deja de ser una
 * promesa: antes había que entrar al banco, buscar el movimiento y adivinar
 * cuál de todos era. Adjuntarlo NO es obligatorio — el que ya transfirió y no
 * lo encuentra no puede quedar trabado — pero cuando viene, se archiva y
 * viaja en el aviso.
 */

export const dynamic = 'force-dynamic';

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!rateLimit(`pago:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const { id } = await params;

    // El comprobante se valida ANTES de tocar nada: rechazar después de haber
    // marcado el pago dejaría el aviso puesto y el archivo afuera.
    const adjunto = await comprobanteDe(req);
    if (adjunto.rechazo && adjunto.rechazo !== 'vacio') {
      return NextResponse.json(
        { error: motivoLegible(adjunto.rechazo) },
        { status: adjunto.rechazo === 'pesado' ? 413 : 415 },
      );
    }

    const db = getSupabaseAdmin();

    const { data: pedido } = await db
      .from('pedidos')
      .select('id, lead_id, firmado_at, total_usd')
      .eq('id', id)
      .maybeSingle();

    const fila = pedido as { id: string; lead_id: string | null; total_usd: number } | null;
    if (!fila?.lead_id) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    const { data: lead } = await db
      .from('leads')
      .select('id, nombre, email, estado, pais, contrato_firmado_at, pago_estado')
      .eq('id', fila.lead_id)
      .maybeSingle();

    const venta = lead as {
      id: string; nombre: string; email: string; pais: string | null;
      contrato_firmado_at: string | null; pago_estado: string | null;
    } | null;

    if (!venta) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    // Sin contrato firmado no hay nada que pagar todavía.
    if (!venta.contrato_firmado_at) {
      return NextResponse.json({ error: 'El contrato todavía no está firmado.' }, { status: 409 });
    }

    // Ya informado o ya cobrado: se responde que sí y no se vuelve a avisar.
    if (venta.pago_estado === 'informado' || venta.pago_estado === 'pagado') {
      return NextResponse.json({ ok: true, estado: venta.pago_estado });
    }

    // El archivo va primero, pero su fallo no frena el aviso: el cliente ya
    // transfirió y perder lo que informó por un problema de nuestro storage
    // sería castigarlo por algo que no hizo.
    const guardado = adjunto.archivo && adjunto.bytes && adjunto.tipo
      ? await archivarComprobante(fila.lead_id, fila.id, adjunto.archivo, adjunto.bytes, adjunto.tipo)
      : null;

    const { error } = await db
      .from('leads')
      .update({ pago_estado: 'informado', ultimo_contacto_at: new Date().toISOString() })
      .eq('id', venta.id);

    if (error) {
      console.error('[api/pedido/pago] No se pudo registrar el aviso:', error);
      return NextResponse.json({ error: 'Could not register the payment.' }, { status: 500 });
    }

    if (guardado) {
      await db.from('pedidos').update({
        comprobante_path: guardado.path,
        comprobante_nombre: guardado.nombre,
        comprobante_at: new Date().toISOString(),
      }).eq('id', fila.id);
    }

    const aviso: DatosDelAviso = {
      leadId: venta.id,
      pedidoId: fila.id,
      cliente: venta.nombre,
      email: venta.email,
      totalUsd: fila.total_usd,
      comprobante: guardado && adjunto.archivo
        ? { bytes: adjunto.bytes!, tipo: adjunto.tipo!, nombre: guardado.nombre }
        : null,
      esperado: {
        montoUsd: fila.total_usd,
        instruccionesDePago: paymentInstructionsFor(venta.pais),
        nombreCliente: venta.nombre,
        firmadoAt: venta.contrato_firmado_at,
      },
      pais: venta.pais,
    };

    // Un solo aviso, con el comprobante adentro y lo que vio la lectura. Eran
    // dos correos sobre lo mismo, llegando al mismo minuto.
    //
    // La lectura va DESPUÉS de contestar: el cliente no tiene por qué esperar
    // a que un modelo mire su captura. Sin comprobante no hay nada que leer y
    // el aviso sale ya.
    if (aviso.comprobante) {
      try {
        after(() => revisarYAvisar(aviso));
      } catch (reason) {
        // `after` tira sin contexto de request. El cliente ya transfirió: si
        // la ayuda no se puede programar, el aviso sale igual, sin revisión.
        console.warn('[api/pedido/pago] No se pudo programar la revisión:', reason);
        await avisar(aviso, null);
      }
    } else {
      await avisar(aviso, null);
    }

    return NextResponse.json({ ok: true, estado: 'informado' });
  } catch (err) {
    console.error('[api/pedido/pago] POST error:', err);
    return NextResponse.json({ error: 'Could not register the payment.' }, { status: 500 });
  }
}

/** El comprobante que vino en el formulario, ya revisado. */
async function comprobanteDe(req: NextRequest) {
  const tipo = req.headers.get('content-type') ?? '';
  if (!tipo.includes('multipart/form-data')) {
    return { archivo: null, rechazo: 'vacio' as const };
  }

  try {
    const form = await req.formData();
    const archivo = form.get('comprobante');
    if (!(archivo instanceof File)) return { archivo: null, rechazo: 'vacio' as const };

    const rechazo = revisarComprobante(archivo);
    if (rechazo) return { archivo, rechazo };

    // El tipo que declara el navegador lo escribe quien sube: un HTML con
    // scripts llegaba diciendo ser «image/png». Se mira el archivo.
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const tipo = tipoReal(bytes);
    if (!tipo) return { archivo, rechazo: 'tipo' as const };

    return { archivo, rechazo: null, bytes, tipo };
  } catch {
    // Un formulario que no se puede leer no puede frenar un aviso de pago.
    return { archivo: null, rechazo: 'vacio' as const };
  }
}

/**
 * Guarda el comprobante en el bucket privado.
 *
 * Devuelve `null` si no se pudo: el aviso del cliente vale igual. Un
 * comprobante lleva el CBU y el titular de una persona, así que nunca se
 * sirve por URL pública — el panel lo abre con un link firmado que vence.
 */
async function archivarComprobante(
  leadId: string,
  pedidoId: string,
  archivo: File,
  bytes: Buffer,
  tipo: TipoComprobante,
): Promise<{ path: string; nombre: string } | null> {
  try {
    // La extensión y el tipo salen de los bytes, no del nombre ni de lo que
    // declaró el navegador: eso lo escribe quien sube el archivo.
    const path = rutaDelComprobante(leadId, pedidoId, `comprobante${tipo.extension}`, randomUUID());

    const { error } = await getSupabaseAdmin().storage.from('comprobantes').upload(
      path,
      new Uint8Array(bytes),
      { contentType: tipo.mime, upsert: false },
    );

    if (error) {
      console.error('[api/pedido/pago] No se pudo archivar el comprobante:', error);
      return null;
    }

    return { path, nombre: nombreVisible(archivo.name) };
  } catch (reason) {
    console.error('[api/pedido/pago] El comprobante no se pudo leer:', reason);
    return null;
  }
}

interface DatosDelAviso {
  leadId: string;
  pedidoId: string;
  cliente: string;
  email: string;
  totalUsd: number;
  pais: string | null;
  comprobante: { bytes: Buffer; tipo: TipoComprobante; nombre: string } | null;
  esperado: Parameters<typeof leerComprobante>[2];
}

/**
 * Lee el comprobante, guarda lo que vio y manda el aviso con todo junto.
 *
 * Si la lectura falla, el aviso sale igual sin revisión: una ayuda que se
 * cae no puede frenar un cobro.
 */
async function revisarYAvisar(aviso: DatosDelAviso): Promise<void> {
  let lectura: Awaited<ReturnType<typeof leerComprobante>> = null;

  try {
    const { bytes, tipo } = aviso.comprobante!;

    // Con la cotización del día, para comparar también en moneda local: sin
    // esto un pago en pesos se comparaba contra dólares.
    const cotizacion = await quoteFor(aviso.pais, aviso.totalUsd);
    lectura = await leerComprobante(bytes, tipo.mime, {
      ...aviso.esperado,
      montoLocal: cotizacion
        ? { moneda: cotizacion.currency, monto: cotizacion.amount, tasa: cotizacion.rate }
        : null,
    });

    if (lectura) {
      await getSupabaseAdmin().from('pedidos').update({
        comprobante_revision: lectura,
        comprobante_veredicto: lectura.revision.veredicto,
      }).eq('id', aviso.pedidoId);
    }
  } catch (reason) {
    console.warn('[api/pedido/pago] No se pudo revisar el comprobante:', reason);
  }

  await avisar(aviso, lectura);
}

/** El aviso a Silvano. Nunca tira: lo que el cliente informó ya quedó guardado. */
async function avisar(
  aviso: DatosDelAviso,
  lectura: Awaited<ReturnType<typeof leerComprobante>>,
): Promise<void> {
  const admin = process.env.ADMIN_EMAIL;
  if (!admin) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvanopuccini.dev';
  const monto = `USD ${Math.round(aviso.totalUsd).toLocaleString('es-AR')}`;
  const comprobante = aviso.comprobante;
  const esImagen = comprobante?.tipo.clase === 'imagen' && comprobante.tipo.mime !== 'image/heic';

  try {
    await sendCrmEmail(
      admin,
      asuntoDeAviso('pago', aviso.cliente, monto, lectura?.revision.veredicto ?? null),
      avisoAdmin({
        tipo: 'pago',
        titulo: comprobante
          ? `${aviso.cliente} subió el comprobante`
          : `${aviso.cliente} avisó que pagó`,
        resumen: comprobante
          ? `Avisó que transfirió ${monto} y adjuntó el comprobante.`
          : `Avisó que transfirió ${monto}. No adjuntó comprobante.`,
        filas: [
          { label: 'Cliente', valor: `${aviso.cliente} · ${aviso.email}` },
          { label: 'Monto', valor: monto },
          ...(lectura?.datos.banco ? [{ label: 'Banco', valor: lectura.datos.banco }] : []),
        ],
        veredicto: lectura?.revision.veredicto ?? null,
        hallazgos: comprobante ? (lectura?.revision.hallazgos ?? []) : undefined,
        imagenCid: esImagen ? 'comprobante' : undefined,
        siguiente: 'Verificá la cuenta y confirmá el pago en el panel para que salga la factura.',
        urlFicha: `${siteUrl}/admin/leads/${aviso.leadId}`,
      }),
      comprobante
        ? [{
          filename: `comprobante${comprobante.tipo.extension}`,
          content: comprobante.bytes,
          contentType: comprobante.tipo.mime,
          ...(esImagen ? { contentId: 'comprobante' } : {}),
        }]
        : undefined,
    );
  } catch (reason) {
    console.warn('[api/pedido/pago] El aviso no salió:', reason);
  }
}
