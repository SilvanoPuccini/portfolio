import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/blog';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  return req.headers.get('authorization') === `Bearer ${process.env.NOTIFY_SECRET}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await req.json() as { slug: string };
  const post = getBlogPostBySlug(slug);

  if (!post) return NextResponse.json({ error: 'Post no encontrado.' }, { status: 404 });

  const siteUrl = 'https://silvanopuccini.dev';

  // ── LinkedIn carousel ─────────────────────────────────────
  const lines = post.content.split('\n');
  const sections: string[] = [];
  let current = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current.trim()) sections.push(current.trim());
      current = line.replace('## ', '').trim();
    } else if (line.trim() && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('|')) {
      const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (clean.length > 30 && clean.length < 220) current += (current ? '\n' : '') + clean;
    }
  }
  if (current.trim()) sections.push(current.trim());

  const slides: string[] = [];
  slides.push(`🔷 ${post.title.toUpperCase()}\n\n${post.excerpt}\n\n↓ Deslizá`);
  sections.slice(0, 4).forEach((sec, i) => {
    const [title, ...rest] = sec.split('\n');
    slides.push(`${i + 2}/${Math.min(sections.length, 4) + 2} — ${title}\n\n${rest.join('\n').substring(0, 280)}`);
  });
  slides.push(`✅ En resumen\n\n${post.excerpt}\n\n🔗 Artículo completo: ${siteUrl}/es/blog/${slug}\n\n#FullStack #${post.category.replace(/\s/g, '')} #Desarrollo #React #NextJS #Django`);

  const linkedinCarousel = slides.map((slide, i) => `--- SLIDE ${i + 1} ---\n${slide}`).join('\n\n');

  // ── Instagram caption ─────────────────────────────────────
  const hashtags = [
    '#FullStackDeveloper', '#DesarrolloWeb', `#${post.category.replace(/\s/g, '')}`,
    '#ProgramaciónWeb', '#TechEspañol', '#React', '#NextJS', '#Django',
    '#DesarrolladorFullStack', '#TipsDesarrollo', '#CódigoLimpio',
  ].join(' ');

  const instagramCaption = `${post.title} 💡\n\n${post.excerpt}\n\n¿Te pasó esto? Contame en los comentarios 👇\n\n🔗 Nota completa en el link de la bio\n\n${hashtags}`;

  // ── Twitter/X thread ──────────────────────────────────────
  const twitterThread = [
    `🧵 ${post.title}\n\n${post.excerpt}\n\nHilo 👇`,
    ...sections.slice(0, 3).map((sec) => {
      const [title, ...rest] = sec.split('\n');
      return `📌 ${title}\n\n${rest.join(' ').substring(0, 200)}`;
    }),
    `Artículo completo → ${siteUrl}/es/blog/${slug}\n\n¿Qué te pareció? Respondé el hilo 👇`,
  ].map((t, i) => `[${i + 1}/${Math.min(sections.length, 3) + 2}] ${t}`).join('\n\n───\n\n');

  return NextResponse.json({ linkedinCarousel, instagramCaption, twitterThread, title: post.title, slug });
}
