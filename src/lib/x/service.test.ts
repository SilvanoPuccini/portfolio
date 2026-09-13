import { describe, expect, it } from 'vitest';
import { parseThreadText } from './service';

describe('parseThreadText', () => {
  it('splits one tweet per line and numbers them from 1', () => {
    const { tweets, oversize } = parseThreadText('Hola\nMundo\nTercero');
    expect(tweets).toEqual([
      { text: 'Hola', tweet_number: 1 },
      { text: 'Mundo', tweet_number: 2 },
      { text: 'Tercero', tweet_number: 3 },
    ]);
    expect(oversize).toEqual([]);
  });

  it('ignores blank lines as visual separators', () => {
    const { tweets } = parseThreadText('Uno\n\n\nDos\n   \nTres');
    expect(tweets.map((t) => t.text)).toEqual(['Uno', 'Dos', 'Tres']);
    expect(tweets.map((t) => t.tweet_number)).toEqual([1, 2, 3]);
  });

  it('trims leading and trailing whitespace per line', () => {
    const { tweets } = parseThreadText('  con espacio  \n\tcon tab ');
    expect(tweets[0].text).toBe('con espacio');
    expect(tweets[1].text).toBe('con tab');
  });

  it('reports tweets over 280 without dropping them', () => {
    const { tweets, oversize } = parseThreadText(`${'o'.repeat(281)}\nok`);
    expect(tweets).toHaveLength(2);
    expect(tweets[0].text).toHaveLength(281);
    expect(oversize).toEqual([{ tweet_number: 1, length: 281 }]);
  });
});