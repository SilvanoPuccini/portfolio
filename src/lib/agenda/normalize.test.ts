import { describe, expect, it } from 'vitest';
import { normalizeAgendaItems } from './normalize';

describe('normalizeAgendaItems', () => {
  it('uses collision-free IDs and channel-specific navigation', () => {
    const common = { status: 'planificado' as const, scheduled_at: '2026-09-13T13:00:00.000Z', pre_approved_at: null, published_at: null };
    const blog = { ...common, post_slug: 'same', raw_title: 'Blog title', raw_content: undefined, has_content: true, content_chars: 10 } as never;
    const linkedin = { ...common, slug: 'same', title: 'LinkedIn title', has_content: true, content_chars: 10 } as never;
    const items = normalizeAgendaItems([blog], [linkedin]);
    expect(items.map((item) => item.id)).toEqual(['blog:same', 'linkedin:same']);
    expect(items.map((item) => item.detail_path)).toEqual(['/admin/agenda/same', '/admin/content/same']);
  });
});
