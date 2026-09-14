import type { PostPublicationListItem } from '@/lib/post-publications/types';
import type { XThreadListItem } from './types';

/** Una referencia a un post de la agenda, con su número de orden cronológico. */
export interface PostRef {
  post_slug: string;
  /** Título del post. */
  title: string;
  /** Número de orden: la posición del post en la agenda completa por fecha. */
  number: number;
  /** Fecha de publicación del post. */
  scheduled_at: string;
}

/** Un grupo de hilos que comparten el mismo post fuente (la misma semana). */
export interface XThreadGroup {
  post_slug: string;
  title: string;
  number: number;
  /** Vacio cuando el post todavía no tiene hilos: el panel ofrece armarlos. */
  threads: XThreadListItem[];
}

/**
 * Todos los posts de la agenda en orden cronológico, numerados por posición.
 * El número es estable mientras no cambie la agenda: sirve para identificar un
 * post de un vistazo, igual que en las otras secciones del admin.
 */
export function orderedPosts(blogs: PostPublicationListItem[]): PostRef[] {
  return [...blogs]
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((blog, index) => ({
      post_slug: blog.post_slug,
      title: blog.raw_title,
      number: index + 1,
      scheduled_at: blog.scheduled_at,
    }));
}

export interface PostFilterOption {
  post_slug: string;
  /** Etiqueta con número y titulo: "Nº 07 · El titulo del post". */
  label: string;
  number: number;
  title: string;
  /** Hilos del post en el rango actual. 0 si todavía no tiene. */
  count: number;
}

/**
 * Opciones del filtro rápido por post, separadas en Pasados y Nuevos según la
 * fecha de publicación del post. Los pasados van del más reciente hacia
 * atrás; los nuevos, hacia adelante. Incluye posts sin hilos: elegirlos es la
 * única forma de volver a un post viejo y armarle la semana.
 */
export function postFilterSections(
  posts: PostRef[],
  countByPost: Record<string, number>,
  now: string,
): { past: PostFilterOption[]; future: PostFilterOption[] } {
  const option = (post: PostRef): PostFilterOption => ({
    post_slug: post.post_slug,
    label: `Nº ${String(post.number).padStart(2, '0')} · ${post.title}`,
    number: post.number,
    title: post.title,
    count: countByPost[post.post_slug] ?? 0,
  });

  const past = posts
    .filter((post) => post.scheduled_at <= now)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
    .map(option);
  const future = posts
    .filter((post) => post.scheduled_at > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map(option);

  return { past, future };
}

/**
 * Agrupa hilos por post fuente, en el orden cronológico de la agenda (numero
 * de post). Los posts sin hilos no generan grupo: la página los agrega aparte.
 */
export function groupThreadsByPost(items: XThreadListItem[], posts: PostRef[]): XThreadGroup[] {
  const byPost = new Map<string, XThreadListItem[]>();
  for (const item of items) {
    const list = byPost.get(item.post_slug) ?? [];
    list.push(item);
    byPost.set(item.post_slug, list);
  }
  const order = new Map(posts.map((post, index) => [post.post_slug, index]));
  return [...byPost.entries()]
    .map(([post_slug, threads]) => ({
      post_slug,
      number: order.has(post_slug) ? posts[order.get(post_slug)!].number : 0,
      title: order.has(post_slug) ? posts[order.get(post_slug)!].title : post_slug,
      threads,
    }))
    .sort((a, b) => (a.number || Infinity) - (b.number || Infinity) || a.title.localeCompare(b.title));
}