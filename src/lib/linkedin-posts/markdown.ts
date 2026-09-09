import matter from 'gray-matter';

function scalarFrontmatter(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) =>
      value === null || ['string', 'number', 'boolean'].includes(typeof value) ||
      (Array.isArray(value) && value.every((item) => ['string', 'number', 'boolean'].includes(typeof item))),
    ),
  );
}

export function markdownToPlainText(markdown: string): string {
  const { content } = matter(markdown.replace(/^\uFEFF/, ''));
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+[.)]\s+/gm, (match) => match.trimEnd() + ' ')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeLinkedInMarkdown(source: string, filename: string) {
  const cleanSource = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const parsed = matter(cleanSource);
  const heading = parsed.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const filenameTitle = filename.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim();
  const title = typeof parsed.data.title === 'string' && parsed.data.title.trim()
    ? parsed.data.title.trim()
    : heading || filenameTitle;

  const bodySource = heading
    ? parsed.content.replace(/^#\s+.+(?:\n|$)/m, '')
    : parsed.content;
  return {
    title,
    body: markdownToPlainText(bodySource),
    sourceMarkdown: cleanSource,
    frontmatter: scalarFrontmatter(parsed.data),
  };
}
