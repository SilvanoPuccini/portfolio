import { describe, expect, it } from 'vitest';
import { groupThreadsByPost, orderedPosts, postFilterSections } from './grouping';
import type { XThreadListItem } from './types';
import type { PostPublicationListItem } from '@/lib/post-publications/types';

function thread(overrides: Partial<XThreadListItem>): XThreadListItem {
  return {
    id: '',
    post_slug: '',
    angle_id: '',
    angle_summary: '',
    thesis: null,
    reply_with_link: null,
    status: 'planificado',
    scheduled_at: '2026-09-14T13:00:00.000Z',
    pre_approved_at: null,
    published_at: null,
    published_ids: [],
    published_url: null,
    approved_fingerprint: null,
    generation_attempts: 0,
    publish_attempts: 0,
    last_error: null,
    plan: null,
    rewrite_history: [],
    deleted_at: null,
    created_at: '2026-09-13T00:00:00.000Z',
    updated_at: '2026-09-13T00:00:00.000Z',
    tweet_count: 0,
    has_content: false,
    preview: '',
    ...overrides,
  };
}

function blog(overrides: Partial<PostPublicationListItem>): PostPublicationListItem {
  return {
    post_slug: '',
    status: 'planificado',
    raw_title: '',
    scheduled_at: '2026-09-13T11:00:00.000Z',
    notify_subscribers: true,
    pre_approved_at: null,
    published_at: null,
    notified_at: null,
    notify_attempts: 0,
    notify_error: null,
    deleted_at: null,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-01T00:00:00.000Z',
    has_content: true,
    content_chars: 100,
    issue: 0,
    ...overrides,
  };
}

const BLOGS: PostPublicationListItem[] = [
  blog({ post_slug: 'post-uno', raw_title: 'El primer post', scheduled_at: '2026-09-06T11:00:00.000Z', issue: 1 }),
  blog({ post_slug: 'post-dos', raw_title: 'El segundo post', scheduled_at: '2026-09-13T11:00:00.000Z', issue: 8 }),
  blog({ post_slug: 'post-tres', raw_title: 'El tercer post', scheduled_at: '2026-09-20T11:00:00.000Z', issue: 13 }),
];

describe('orderedPosts', () => {
  it('keeps the real issue number of each post', () => {
    const posts = orderedPosts(BLOGS);
    expect(posts.map((p) => [p.post_slug, p.number])).toEqual([
      ['post-uno', 1], ['post-dos', 8], ['post-tres', 13],
    ]);
  });

  it('sorts by scheduled date even if the input is shuffled', () => {
    const posts = orderedPosts([BLOGS[2], BLOGS[0], BLOGS[1]]);
    expect(posts.map((p) => p.post_slug)).toEqual(['post-uno', 'post-dos', 'post-tres']);
  });

  it('carries 0 when the post has no edition number', () => {
    const posts = orderedPosts([blog({ post_slug: 'sin-edicion', raw_title: 'Sin edicion', scheduled_at: '2026-09-10T11:00:00.000Z' })]);
    expect(posts[0].number).toBe(0);
  });
});

describe('postFilterSections', () => {
  const now = '2026-09-13T12:00:00.000Z';

  it('splits past and future posts and labels them with the real number and title', () => {
    const { past, future } = postFilterSections(orderedPosts(BLOGS), {}, now);
    expect(past.map((p) => p.post_slug)).toEqual(['post-dos', 'post-uno']);
    expect(past[0].label).toBe('Nº 08 · El segundo post');
    expect(future.map((p) => p.post_slug)).toEqual(['post-tres']);
    expect(future[0].label).toBe('Nº 13 · El tercer post');
  });

  it('labels posts without an edition number by title only', () => {
    const posts = orderedPosts([blog({ post_slug: 'sin-edicion', raw_title: 'Sin edicion', scheduled_at: '2026-09-01T11:00:00.000Z' })]);
    const { past } = postFilterSections(posts, {}, now);
    expect(past[0].label).toBe('Sin edicion');
  });

  it('counts the threads each post has in the current scope', () => {
    const { past, future } = postFilterSections(
      orderedPosts(BLOGS),
      { 'post-uno': 4, 'post-tres': 0 },
      now,
    );
    expect(past.find((p) => p.post_slug === 'post-uno')?.count).toBe(4);
    expect(past.find((p) => p.post_slug === 'post-dos')?.count).toBe(0);
    expect(future[0].count).toBe(0);
  });

  it('exposes posts without threads in both sections', () => {
    const { past, future } = postFilterSections(orderedPosts(BLOGS), {}, now);
    expect(past).toHaveLength(2);
    expect(future).toHaveLength(1);
  });
});

describe('groupThreadsByPost', () => {
  const posts = orderedPosts(BLOGS);

  it('groups by post and keeps the chronological post order', () => {
    const groups = groupThreadsByPost([
      thread({ id: 'a', post_slug: 'post-dos' }),
      thread({ id: 'b', post_slug: 'post-uno' }),
      thread({ id: 'c', post_slug: 'post-dos' }),
    ], posts);
    expect(groups.map((g) => [g.post_slug, g.number, g.title])).toEqual([
      ['post-uno', 1, 'El primer post'],
      ['post-dos', 8, 'El segundo post'],
    ]);
    expect(groups[1].threads.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('falls back to the slug when the post is not in the agenda', () => {
    const groups = groupThreadsByPost([thread({ id: 'a', post_slug: 'post-fantasma' })], posts);
    expect(groups[0].title).toBe('post-fantasma');
    expect(groups[0].number).toBe(0);
  });

  it('returns an empty list without threads', () => {
    expect(groupThreadsByPost([], posts)).toEqual([]);
  });
});