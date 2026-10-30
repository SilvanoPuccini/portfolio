import { describe, expect, it } from 'vitest';
import { getAllBlogPosts, getBlogPostBySlug } from './mdx';

describe('PostgreSQL editorial preview', () => {
  it('loads the Sunday article through the existing blog loader', async () => {
    const post = await getBlogPostBySlug('postgresql-modelo-de-datos');

    expect(post).not.toBeNull();
    expect(post).toMatchObject({
      title: 'PostgreSQL: el modelo de datos también es una decisión de producto',
      date: '2026-11-01',
      category: 'Producto',
      keyword: 'PostgreSQL',
      featured: false,
      linkedinCarousel: false,
    });
    expect(post!.content.trimStart().startsWith(post!.excerpt)).toBe(true);
    expect(post!.content).toContain('<PriceHistoryBlock />');
    expect(post!.content).toContain('<MembershipModelBlock />');
    expect(post!.content).toContain('Los ejemplos de esta nota son didácticos.');
    expect(post!.content).toContain('## La pregunta que queda abierta');
    expect(post!.content).not.toContain('\u2014');
    expect(getAllBlogPosts().find((item) => item.slug === post!.slug)?.issue).toBe(post!.issue);
  });

  it('keeps the previous article and its diagram references available', async () => {
    const post = await getBlogPostBySlug('despues-del-deploy');

    expect(post?.date).toBe('2026-10-25');
    expect(post?.content).toContain('<SignalLadderBlock />');
    expect(post?.content).toContain('<UsefulAlertBlock />');
  });
});
