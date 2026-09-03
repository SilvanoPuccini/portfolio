import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyUnsubToken } from '@/lib/unsub-token';

export const dynamic = 'force-dynamic';

/**
 * La baja se ejecuta en un POST, nunca al abrir la página.
 *
 * Antes el propio GET corría el UPDATE: los escáneres de seguridad de correo y
 * los prefetchers de los clientes de mail visitan los links de un email sin
 * que nadie los toque, así que daban de baja suscriptores solos. El token
 * firmado impedía que un tercero diera de baja a otro, pero no impedía que se
 * disparara sin intención.
 */
async function confirmUnsubscribe(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '');
  const token = String(formData.get('token') ?? '');
  const exp = Number(formData.get('exp') ?? 0);

  if (!email || !token || !exp || !verifyUnsubToken(email, token, exp)) {
    redirect('/unsubscribe?state=not_found');
  }

  const { data, error } = await getSupabaseAdmin()
    .from('subscribers')
    .update({ status: 'unsubscribed' })
    .eq('email', email.toLowerCase())
    .select()
    .single();

  if (error || !data) redirect('/unsubscribe?state=not_found');
  redirect('/unsubscribe?state=success');
}

const COPY = {
  confirm: {
    label: 'Confirmar',
    labelColor: '#00d4d4',
    title: '¿Querés dejar de recibir El Radar?',
    description: 'Vas a dejar de recibir los envíos. Podés volver a suscribirte cuando quieras.',
  },
  success: {
    label: 'Desuscripto',
    labelColor: '#94a3b8',
    title: 'Ya no recibirás más emails',
    description: 'Tu email fue removido de El Radar.',
  },
  not_found: {
    label: 'No encontrado',
    labelColor: '#f87171',
    title: 'No encontramos ese email',
    description: 'Es posible que ya estés desuscripto o que el link sea incorrecto.',
  },
} as const;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string; exp?: string; state?: string }>;
}) {
  const { email, token, exp, state } = await searchParams;

  const decoded = email ? decodeURIComponent(email) : '';
  const expMs = exp ? Number(exp) : 0;
  const validToken = Boolean(
    decoded && token && expMs > 0 && verifyUnsubToken(decoded, token, expMs),
  );

  const view =
    state === 'success' ? 'success' : state === 'not_found' || !validToken ? 'not_found' : 'confirm';
  const content = COPY[view];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: content.labelColor,
            marginBottom: 16,
          }}
        >
          El Radar · {content.label}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
          {content.title}
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
          {view === 'confirm' && decoded ? `Confirmá la baja de ${decoded}.` : content.description}
        </p>

        {view === 'confirm' && (
          <form action={confirmUnsubscribe} style={{ marginBottom: 28 }}>
            <input type="hidden" name="email" value={decoded} />
            <input type="hidden" name="token" value={token ?? ''} />
            <input type="hidden" name="exp" value={exp ?? ''} />
            <button
              type="submit"
              style={{
                background: '#f87171',
                color: '#0a0a14',
                border: 'none',
                borderRadius: 8,
                padding: '12px 26px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Sí, darme de baja
            </button>
          </form>
        )}

        <a
          href="https://silvanopuccini.dev"
          style={{ color: '#00d4d4', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}
        >
          Volver al sitio →
        </a>
      </div>
    </div>
  );
}
