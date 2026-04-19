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

  const status = email
    ? await unsubscribeEmail(decodeURIComponent(email))
    : 'not_found';

  const content = {
    success: {
      label: 'Desuscripto',
      labelColor: '#94a3b8',
      title: 'Ya no recibirás más emails',
      description: email
        ? `El email ${decodeURIComponent(email)} fue removido de El Radar.`
        : 'Tu email fue removido de El Radar.',
    },
    not_found: {
      label: 'No encontrado',
      labelColor: '#f87171',
      title: 'No encontramos ese email',
      description: 'Es posible que ya estés desuscripto o que el link sea incorrecto.',
    },
    error: {
      label: 'Error',
      labelColor: '#f87171',
      title: 'Algo salió mal',
      description: 'No pudimos procesar tu solicitud. Escribime directo a hola@silvanopuccini.dev.',
    },
  }[status];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: content.labelColor, marginBottom: 16 }}>
          El Radar · {content.label}
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>
          {content.title}
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 32 }}>
          {content.description}
        </p>
        <a href="https://silvanopuccini.dev" style={{ color: '#00d4d4', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
          Volver al sitio →
        </a>
      </div>
    </div>
  );
}
