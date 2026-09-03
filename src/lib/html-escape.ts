/**
 * Escapa texto que se interpola dentro del HTML de un email.
 *
 * Los clientes de correo no ejecutan JavaScript, así que esto no es XSS. El
 * riesgo es otro: los datos vienen de formularios públicos (`/api/leads`,
 * `/api/contact`), y sin escapar alguien puede meter marcado en un mail que
 * sale firmado con tu propio SPF/DKIM. Un `<a href="https://phishing/">Ver
 * lead completo</a>` dentro de una notificación legítima tuya es mucho más
 * creíble que cualquier phishing de afuera.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
