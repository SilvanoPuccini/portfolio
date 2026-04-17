import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExistsSync = vi.fn();
const mockReaddirSync = vi.fn();
const mockReadFileSync = vi.fn();

vi.mock('fs', () => ({
  default: {
    existsSync: (...args: unknown[]) => mockExistsSync(...args),
    readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
    readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  },
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

import { getAllBlogPosts, getBlogPostBySlug } from './mdx';

// Helper: genera frontmatter MDX mínimo válido
function makeMdx(overrides: { title?: string; date?: string; category?: string; excerpt?: string } = {}) {
  const { title = 'Test Post', date = '2026-01-01', category = 'Performance', excerpt = 'Test excerpt' } = overrides;
  return `---\ntitle: '${title}'\ndate: '${date}'\ncategory: '${category}'\nexcerpt: '${excerpt}'\nreadingTime: '3 min'\n---\nContent here.`;
}

const POSTS = [
  { slug: 'post-oldest', date: '2026-01-01', title: 'Oldest Post' },
  { slug: 'post-middle', date: '2026-02-15', title: 'Middle Post' },
  { slug: 'post-newest', date: '2026-03-30', title: 'Newest Post' },
];

function setupFsMock() {
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue(POSTS.map((p) => `${p.slug}.mdx`));
  mockReadFileSync.mockImplementation((filePath: string) => {
    const match = POSTS.find((p) => filePath.includes(p.slug));
    if (!match) return '';
    return makeMdx({ title: match.title, date: match.date });
  });
}

describe('getAllBlogPosts()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFsMock();
  });

  it('assigns issue Nº 1 to the oldest post', () => {
    const posts = getAllBlogPosts();
    const oldest = posts.find((p) => p.slug === 'post-oldest');
    expect(oldest?.issue).toBe(1);
  });

  it('assigns issue numbers ascending by date', () => {
    const posts = getAllBlogPosts();
    const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p.issue]));
    expect(bySlug['post-oldest']).toBe(1);
    expect(bySlug['post-middle']).toBe(2);
    expect(bySlug['post-newest']).toBe(3);
  });

  it('returns posts sorted newest-first for display', () => {
    const posts = getAllBlogPosts();
    expect(posts[0].slug).toBe('post-newest');
    expect(posts[1].slug).toBe('post-middle');
    expect(posts[2].slug).toBe('post-oldest');
  });

  it('returns an empty array when the blog directory does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    const posts = getAllBlogPosts();
    expect(posts).toEqual([]);
  });

  it('maps frontmatter fields correctly', () => {
    const posts = getAllBlogPosts();
    const post = posts.find((p) => p.slug === 'post-oldest')!;
    expect(post.title).toBe('Oldest Post');
    expect(post.date).toBe('2026-01-01');
    expect(post.category).toBe('Performance');
    expect(post.readingTime).toBe('3 min');
    expect(post.featured).toBe(false);
  });
});

describe('getBlogPostBySlug()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFsMock();
  });

  it('returns null for a slug that does not exist', async () => {
    mockExistsSync.mockImplementation((p: string) => !p.includes('nonexistent'));
    const post = await getBlogPostBySlug('nonexistent');
    expect(post).toBeNull();
  });

  it('returns the correct issue number for the newest slug', async () => {
    const post = await getBlogPostBySlug('post-newest');
    expect(post?.issue).toBe(3);
  });

  it('returns issue Nº 1 for the oldest slug', async () => {
    const post = await getBlogPostBySlug('post-oldest');
    expect(post?.issue).toBe(1);
  });

  it('returns the full post with all required fields', async () => {
    const post = await getBlogPostBySlug('post-middle');
    expect(post).not.toBeNull();
    expect(post?.slug).toBe('post-middle');
    expect(post?.title).toBe('Middle Post');
    expect(post?.content).toContain('Content here.');
  });
});
