import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function unsubscribeEmail(email: string): Promise<'success' | 'not_found' | 'error'> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('subscribers')
      .update({ status: 'unsubscribed' })
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error || !data) return 'not_found';
    return 'success';
  } catch {
    return 'error';
  }
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  if (!email) {
    return <UnsubscribeLayout status="not_found" />;
  }

  const status = await unsubscribeEmail(decodeURIComponent(email));

  return <UnsubscribeLayout status={status} email={email} />;
}

function UnsubscribeLayout({
  status,
  email,
}: {
  status: 'success' | 'not_found' | 'error';
  email?: string;
}) {
  const content = {
    success: {
      label: 'Desuscripto',
      title: 'Ya no recibirás más emails',
      description: email
        ? `El email ${decodeURIComponent(email)} fue removido de El Radar.`
        : 'Tu email fue removido de El Radar.',
      labelColor: '#94a3b8',
    },
    not_found: {
      label: 'No encontrado',
      title: 'No encontramos ese email',
      description: 'Es posible que ya estés desuscripto o que el link sea incorrecto.',
      labelColor: '#f87171',
    },
    error: {
      label: 'Error',
      title: 'Algo salió mal',
      description: 'No pudimos procesar tu solicitud. Escribime directo a hola@silvanopuccini.dev.',
      labelColor: '#f87171',
    },
  }[status];

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0a0a14', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: content.labelColor, marginBottom: 16 }}>
            El Radar · {content.label}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
            {content.title}
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
            {content.description}
          </p>
          <a
            href="https://silvanopuccini.dev"
            style={{ color: '#00d4d4', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}
          >
            Volver al sitio →
          </a>
        </div>
      </body>
    </html>
  );
}
