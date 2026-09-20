import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTranscript, transcriptLink } from './calcom-transcript';

afterEach(() => { vi.unstubAllGlobals(); });

const links = (formats: string[]) => ({
  downloadLinks: { transcription: formats.map((format) => ({ format, link: `https://s3/x.${format}` })) },
});

describe('transcriptLink', () => {
  it('elige el texto plano entre los cuatro formatos', () => {
    expect(transcriptLink(links(['json', 'srt', 'txt', 'vtt']))).toBe('https://s3/x.txt');
  });

  it('si no vino el .txt usa el primero disponible', () => {
    expect(transcriptLink(links(['srt', 'vtt']))).toBe('https://s3/x.srt');
  });

  it('sin links devuelve null', () => {
    expect(transcriptLink({})).toBeNull();
    expect(transcriptLink({ downloadLinks: { transcription: [] } })).toBeNull();
  });
});

describe('fetchTranscript', () => {
  it('devuelve el texto de la llamada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '  Hola, contame\nNecesito un catálogo  ' }));

    expect(await fetchTranscript('https://s3/x.txt')).toBe('Hola, contame\nNecesito un catálogo');
  });

  it('un archivo vacío no se guarda', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => '   ' }));

    expect(await fetchTranscript('https://s3/x.txt')).toBeNull();
  });

  it('un link vencido no rompe el webhook', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => '' }));
    expect(await fetchTranscript('https://s3/x.txt')).toBeNull();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect(await fetchTranscript('https://s3/x.txt')).toBeNull();
  });
});
