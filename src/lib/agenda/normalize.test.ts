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

  it('deep-links an X agenda item to its matching thread', () => {
    const thread = {
      id: 'thread/id with spaces',
      status: 'preaprobado',
      scheduled_at: '2026-09-13T13:00:00.000Z',
      pre_approved_at: '2026-09-12T13:00:00.000Z',
      published_at: null,
      angle_summary: 'Ángulo | pregunta',
      preview: 'Primer tweet',
      has_content: true,
    } as never;

    const [item] = normalizeAgendaItems([], [], [thread]);

    expect(item.source_id).toBe('thread/id with spaces');
    expect(item.detail_path).toBe('/admin/x?thread=thread%2Fid%20with%20spaces');
  });
});
