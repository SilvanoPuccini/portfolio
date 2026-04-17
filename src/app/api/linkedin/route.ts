import { NextRequest, NextResponse } from 'next/server';
import { getBlogPostBySlug } from '@/lib/mdx';

export async function GET(req: NextRequest) {
  // Ruta interna: solo accesible con el token configurado en env
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const expected = process.env.LINKEDIN_API_SECRET;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Falta el parámetro slug.' }, { status: 400 });
  }

  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: 'Post no encontrado.' }, { status: 404 });
  }

  if (!post.linkedinCarousel) {
    return NextResponse.json(
      { error: 'Este post no tiene linkedinCarousel habilitado.' },
      { status: 400 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';

  // Extraer secciones del contenido MDX (headings ## y párrafos clave)
  const lines = post.content.split('\n');
  const sections: string[] = [];
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection.trim()) sections.push(currentSection.trim());
      currentSection = line.replace('## ', '').trim();
    } else if (line.startsWith('**') && line.endsWith('**')) {
      const bold = line.replace(/\*\*/g, '').trim();
      if (bold) currentSection += (currentSection ? '\n' : '') + bold;
    } else if (line.trim() && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('|')) {
      const clean = line.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (clean.length > 30 && clean.length < 200) {
        currentSection += (currentSection ? '\n' : '') + clean;
      }
    }
  }
  if (currentSection.trim()) sections.push(currentSection.trim());

  // Generar slides del carrusel
  const slides: string[] = [];

  // Slide 1 — Hook
  slides.push(`🔷 ${post.title.toUpperCase()}\n\n${post.excerpt}\n\n↓ Deslizá`);

  // Slides intermedios — una sección por slide (máx 4)
  const contentSlides = sections.slice(0, 4);
  contentSlides.forEach((section, i) => {
    const lines = section.split('\n');
    const title = lines[0];
    const body = lines.slice(1).join('\n').substring(0, 280);
    slides.push(`${i + 2}/${contentSlides.length + 2} — ${title}\n\n${body}`);
  });

  // Slide final — CTA
  slides.push(
    `✅ En resumen\n\n${post.excerpt}\n\n🔗 Artículo completo en el link del perfil\n📌 ${siteUrl}/es/blog/${slug}\n\n#FullStack #${post.category.replace(/\s/g, '')} #Desarrollo #Django #React #NextJS`
  );

  const formatted = slides
    .map((slide, i) => `--- SLIDE ${i + 1} ---\n${slide}`)
    .join('\n\n');

  return NextResponse.json({
    slug,
    title: post.title,
    category: post.category,
    slides: slides.length,
    content: formatted,
  });
}
