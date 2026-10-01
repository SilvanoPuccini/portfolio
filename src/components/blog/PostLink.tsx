import type { AnchorHTMLAttributes } from 'react';

const OWN_HOSTS = new Set(['silvanopuccini.dev', 'www.silvanopuccini.dev']);

/** Un link http(s) a otro dominio. Rutas relativas, anclas y mailto son propios. */
function isExternal(href: string | undefined): boolean {
  if (!href || !/^https?:\/\//i.test(href)) return false;
  try {
    return !OWN_HOSTS.has(new URL(href).hostname);
  } catch {
    return false;
  }
}

/**
 * Los links de los posts. Los que salen del sitio abren en otra pestaña: el
 * lector consulta la fuente y vuelve al artículo sin perder dónde estaba.
 * Los propios se quedan en la misma, como cualquier navegación del blog.
 */
export function PostLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!isExternal(props.href)) return <a {...props} />;
  return <a {...props} target="_blank" rel="noopener noreferrer" />;
}
