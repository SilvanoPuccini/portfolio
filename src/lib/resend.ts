import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvano.dev';

export async function sendWelcomeEmail(email: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenido al radar de silvano.dev',
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido al radar</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;">
                silvano.dev
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#16161f;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:40px 36px;">
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:600;color:#f1f5f9;line-height:1.2;">
                Ya estás en el radar.
              </h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#94a3b8;">
                Vas a recibir 1–2 posts por semana sobre performance, producto y automatización — con contexto real, sin relleno.
              </p>
              <p style="margin:0 0 32px;font-size:16px;line-height:1.7;color:#94a3b8;">
                Mientras tanto, podés leer lo que ya está publicado:
              </p>
              <a href="${SITE_URL}/blog"
                 style="display:inline-block;background-color:#00d4d4;color:#0f0f14;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:8px;">
                Ver el blog →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;">
              <p style="margin:0;font-family:monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#374151;text-align:center;">
                Recibiste este email porque te suscribiste en silvano.dev
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
