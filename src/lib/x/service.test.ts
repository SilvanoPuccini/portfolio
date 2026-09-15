import { beforeEach, describe, expect, it, vi } from 'vitest';
import { weightedLength } from './validate';

const repository = vi.hoisted(() => ({
  createThread: vi.fn(),
  allowedUrls: vi.fn(() => []),
  appendRewriteHistory: vi.fn(),
  createWeek: vi.fn(),
  recentAngles: vi.fn(),
  siblingsOf: vi.fn(),
  updateThread: vi.fn(),
}));

vi.mock('./repository', () => repository);

import { importThread, parseThreadText } from './service';

describe('parseThreadText', () => {
  it('normalizes CRLF and joins single line breaks with one space', () => {
    expect(parseThreadText('Hola\r\n  Mundo\n\tTercero')).toEqual([
      { text: 'Hola Mundo Tercero', tweet_number: 1 },
    ]);
  });

  it('packs complete paragraphs and preserves their separation when they fit', () => {
    expect(parseThreadText('Primer párrafo.\n\nSegundo párrafo.')).toEqual([
      { text: 'Primer párrafo.\n\nSegundo párrafo.', tweet_number: 1 },
    ]);
  });

  it('starts a new post when the next complete paragraph would exceed 280', () => {
    const tweets = parseThreadText(`${'a'.repeat(200)}\n\n${'b'.repeat(100)}\ncontinuación`);
    expect(tweets.map((tweet) => tweet.text)).toEqual([
      'a'.repeat(200),
      `${'b'.repeat(100)} continuación`,
    ]);
    expect(tweets.map((tweet) => tweet.tweet_number)).toEqual([1, 2]);
  });

  it('falls back to the last whitespace that fits in an oversized paragraph', () => {
    const tweets = parseThreadText(`${'a'.repeat(200)} ${'b'.repeat(100)}`);
    expect(tweets.map((tweet) => tweet.text)).toEqual(['a'.repeat(200), 'b'.repeat(100)]);
  });

  it('prefers sentence-final punctuation when splitting an oversized paragraph', () => {
    const firstSentence = `${'a'.repeat(190)}.`;
    const secondSentence = `${'b'.repeat(100)}.`;
    const tweets = parseThreadText(`${firstSentence} ${secondSentence}`);

    expect(tweets.map((tweet) => tweet.text)).toEqual([firstSentence, secondSentence]);
  });

  it('hard cuts only an uninterrupted token and never exceeds 280 weighted characters', () => {
    const tweets = parseThreadText('o'.repeat(561));
    expect(tweets.map((tweet) => tweet.text.length)).toEqual([280, 280, 1]);
    expect(tweets.map((tweet) => tweet.text).join('')).toBe('o'.repeat(561));
  });

  it('trims only boundary whitespace and never emits empty chunks', () => {
    const tweets = parseThreadText(` \n\n ${'a'.repeat(275)}     ${'b'.repeat(10)} \n\n `);
    expect(tweets.map((tweet) => tweet.text)).toEqual(['a'.repeat(275), 'b'.repeat(10)]);
  });

  it('preserves combining characters in non-boundary content', () => {
    const text = 'cancio\u0301n sin normalizar';
    expect(parseThreadText(text)[0].text).toBe(text);
  });

  it('uses twitter-text weighting instead of raw character count', () => {
    const text = 'あ'.repeat(200);
    const tweets = parseThreadText(text);

    expect(tweets.map((tweet) => tweet.text.length)).toEqual([140, 60]);
    expect(tweets.every((tweet) => weightedLength(tweet.text).valid)).toBe(true);
    expect(tweets.every((tweet) => weightedLength(tweet.text).length <= 280)).toBe(true);
    expect(tweets.map((tweet) => tweet.text).join('')).toBe(text);
  });

  it('treats a normalized single newline like ordinary whitespace', () => {
    const withNewline = parseThreadText(`${'あ'.repeat(100)}\n${'い'.repeat(60)}`);
    const withSpace = parseThreadText(`${'あ'.repeat(100)} ${'い'.repeat(60)}`);

    expect(withNewline).toEqual(withSpace);
    expect(withNewline.map((tweet) => tweet.text)).toEqual(['あ'.repeat(100), 'い'.repeat(60)]);
  });

  it('does not split emoji grapheme clusters when hard-cutting a token', () => {
    const grapheme = '👨‍👩‍👧‍👦';
    const text = grapheme.repeat(150);
    const tweets = parseThreadText(text);
    const segmenter = new Intl.Segmenter('es', { granularity: 'grapheme' });

    expect(tweets.every((tweet) => (
      Array.from(segmenter.segment(tweet.text), ({ segment }) => segment).every((segment) => segment === grapheme)
    ))).toBe(true);
    expect(tweets.every((tweet) => weightedLength(tweet.text).valid)).toBe(true);
    expect(tweets.map((tweet) => tweet.text).join('')).toBe(text);
  });

  it('splits an individually oversized grapheme only when it cannot fit whole', () => {
    const text = `a${'\u0301'.repeat(300)}`;
    const tweets = parseThreadText(text);

    expect(Array.from(new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(text))).toHaveLength(1);
    expect(tweets.length).toBeGreaterThan(1);
    expect(tweets.every((tweet) => weightedLength(tweet.text).valid)).toBe(true);
    expect(tweets.map((tweet) => tweet.text).join('')).toBe(text);
  });

  it('keeps a long URL whole when twitter-text counts it as 23', () => {
    const text = `Antes ${`https://example.com/${'x'.repeat(400)}`} después`;
    const tweets = parseThreadText(text);

    expect(text.length).toBeGreaterThan(280);
    expect(weightedLength(text)).toEqual({ length: 37, valid: true });
    expect(tweets).toEqual([{ text, tweet_number: 1 }]);
  });

  it('preserves all non-boundary content and keeps every post valid for X', () => {
    const text = `${'a'.repeat(150)}. ${'b'.repeat(150)} ${'c'.repeat(300)}`;
    const tweets = parseThreadText(text);
    expect(tweets.every((tweet) => weightedLength(tweet.text).valid)).toBe(true);
    expect(tweets.map((tweet) => tweet.text).join('').replace(/\s/gu, '')).toBe(text.replace(/\s/gu, ''));
  });

  it('produces no posts for blank text', () => {
    expect(parseThreadText('   \n  ')).toEqual([]);
  });
});

describe('importThread', () => {
  beforeEach(() => {
    repository.createThread.mockReset();
    repository.createThread.mockImplementation(async (row) => ({ id: 'imported', ...row }));
  });

  it('preserves validation metadata and returns the compatibility report', async () => {
    const result = await importThread({
      post_slug: 'post',
      angle_id: 'manual',
      angle_summary: 'Importado | pregunta',
      scheduled_at: '2026-09-15T12:00:00.000Z',
      text: 'あ'.repeat(600),
    });

    const saved = repository.createThread.mock.calls[0][0];
    expect(saved.approved_fingerprint).toBeNull();
    expect(saved.last_error).toBe(
      'link_reply: La respuesta con links no entra: 0 sobre 280. | link_reply: La respuesta tiene que llevar al menos una URL.',
    );
    expect(saved.tweets.length).toBeGreaterThan(4);
    expect(saved.tweets.every((tweet: { text: string }) => weightedLength(tweet.text).valid)).toBe(true);
    expect(result.thread).toEqual({ id: 'imported', ...saved });
    expect(result.oversize).toEqual([]);
  });
});
