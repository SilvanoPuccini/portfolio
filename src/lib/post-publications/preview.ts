import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/admin-auth';

/** Query param que pide ver un post oculto desde la página pública real. */
export const PREVIEW_PARAM = 'preview';

/**
 * ¿Quien pide la página tiene sesión de admin? Se usa para dejar ver un post
 * todavía no publicado en su ruta real (`/es/blog/<slug>?preview=1`), en vez
 * de reconstruir el artículo en otra pantalla: así lo que se revisa es
 * exactamente lo que va a salir publicado, mismo layout y mismo tema.
 */
export async function hasAdminSession(): Promise<boolean> {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) return false;

  const token = (await cookies()).get('admin_session')?.value;
  if (!token) return false;

  return verifySessionToken(token, sessionSecret);
}

/** URL de vista previa de un post en su página pública real. */
export function previewUrl(slug: string, locale = 'es'): string {
  return `/${locale}/blog/${slug}?${PREVIEW_PARAM}=1`;
}
