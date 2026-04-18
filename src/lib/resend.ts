import { Resend } from 'resend';

export async function sendWelcomeEmail(email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.RESEND_FROM_EMAIL
    ? `Silvano Puccini <${process.env.RESEND_FROM_EMAIL}>`
    : 'Silvano Puccini <onboarding@resend.dev>';
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://silvano.dev';

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenido a El Radar — Silvano Puccini',
    html: `
<div style="max-width:560px;margin:0 auto;font-family:sans-serif;background:#0f0f14;border-radius:12px;overflow:hidden;border:1px solid #1e1e2e;">
  <div style="padding:28px 32px 20px;border-bottom:1px solid #1a1a2a;">
    <span style="font-family:monospace;font-size:12px;color:#00d4d4;letter-spacing:0.1em;">SILVANO PUCCINI · FULL STACK DEV</span>
  </div>
  <div style="padding:32px 32px 24px;">
    <p style="font-size:13px;color:#666;font-family:monospace;margin:0 0 12px;">¡Hola! 👋</p>
    <p style="font-size:22px;font-weight:700;color:#f0f0f0;margin:0 0 8px;">Me alegra que estés acá.</p>
    <div style="width:36px;height:2px;background:#00d4d4;margin:16px 0 20px;"></div>
    <p style="font-size:14px;color:#aaa;line-height:1.7;margin:0 0 16px;">Te suscribiste a</p>
    <div style="text-align:center;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
        <tr>
          <td style="border-bottom:1px solid #444;width:40%;"></td>
          <td style="white-space:nowrap;padding:0 8px;font-family:monospace;font-size:8px;color:#999;letter-spacing:0.22em;text-transform:uppercase;">est. 2026</td>
          <td style="border-bottom:1px solid #444;width:40%;"></td>
        </tr>
      </table>
      <p style="font-family:sans-serif;font-size:11px;font-weight:600;color:#bbb;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 2px;">El</p>
      <p style="font-family:sans-serif;font-size:22px;font-weight:700;color:#888;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 6px;">Radar</p>
      <p style="font-family:monospace;font-size:8px;color:#777;letter-spacing:0.18em;text-transform:uppercase;margin:0;">arquitectura · código · producto</p>
    </div>
    <p style="font-size:14px;color:#aaa;line-height:1.7;margin:0 0 12px;">el blog de <strong style="color:#f0f0f0;">Silvano Puccini</strong> — un espacio donde documento decisiones reales de desarrollo, sin relleno y sin tutoriales de introducción.</p>
    <p style="font-size:14px;color:#aaa;line-height:1.7;margin:0 0 28px;">Vas a recibir <strong style="color:#f0f0f0;">1–2 posts por semana</strong> sobre performance, producto y automatización con IA.</p>
    <div style="background:#111120;border:1px solid #1e1e2e;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="font-size:11px;font-family:monospace;color:#00d4d4;margin:0 0 10px;letter-spacing:0.08em;">LO QUE VAS A ENCONTRAR</p>
      <p style="font-size:13px;color:#bbb;margin:6px 0;">→ Performance real — Web Vitals, optimización y arquitectura</p>
      <p style="font-size:13px;color:#bbb;margin:6px 0;">→ Producto — qué funciona, qué no, y por qué</p>
      <p style="font-size:13px;color:#bbb;margin:6px 0;">→ Automatización con IA — herramientas en proyectos reales</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding-bottom:12px;">
          <a href="${SITE_URL}/es/blog" style="display:inline-block;background:#00d4d4;color:#0a0a12;font-size:13px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;">Ver el blog →</a>
        </td>
      </tr>
      <tr>
        <td>
          <a href="https://www.linkedin.com/in/silvano-puccini/" style="display:inline-block;background:transparent;color:#aaa;font-size:13px;font-weight:500;padding:12px 24px;border-radius:6px;text-decoration:none;border:1px solid #2a2a3a;">Seguime en LinkedIn →</a>
        </td>
      </tr>
    </table>
    <p style="font-size:13px;color:#555;margin:24px 0 0;line-height:1.6;">Si tenés alguna pregunta o querés proponer un tema, mantenete cerca del radar — no te pierdas. Respondé este mail directamente — leo todo.<br><br>Un abrazo,<br><span style="color:#aaa;">Silvano</span></p>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #1a1a2a;">
    <span style="font-size:11px;font-family:monospace;color:#444;">Silvano Puccini · Full Stack Dev</span>
  </div>
</div>
`,
  });
}
