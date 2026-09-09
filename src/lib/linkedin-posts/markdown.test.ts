import { describe, expect, it } from 'vitest';
import { normalizeLinkedInMarkdown } from './markdown';

describe('normalizeLinkedInMarkdown', () => {
  it('preserves the source and produces safe readable copy', () => {
    const source = '---\ntitle: Una decisión concreta\ntags: [react, arquitectura]\n---\n# Ignorado como título\n\n**Texto** con [referencia](https://example.com).\n\n- Primer costo\n- Segundo costo\n\n<script>alert(1)</script>';
    const result = normalizeLinkedInMarkdown(source, 'fallback.md');
    expect(result.title).toBe('Una decisión concreta');
    expect(result.sourceMarkdown).toBe(source);
    expect(result.frontmatter).toEqual({ title: 'Una decisión concreta', tags: ['react', 'arquitectura'] });
    expect(result.body).toContain('Texto con referencia.');
    expect(result.body).toContain('• Primer costo');
    expect(result.body).not.toContain('**');
    expect(result.body).not.toContain('<script>');
    expect(result.body).not.toContain('https://');
  });
});
