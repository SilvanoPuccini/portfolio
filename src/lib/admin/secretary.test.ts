import { describe, expect, it } from 'vitest';
import { isSummaryFresh, secretaryInput, secretarySystemPrompt } from './secretary';
import type { Alert } from './alerts';

const NOW = new Date('2026-09-18T15:00:00.000Z');

function alert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'leads-sin-contactar',
    severity: 'urgent',
    text: '2 leads sin contactar hace más de 48 h',
    href: '/admin/leads',
    count: 2,
    ...overrides,
  };
}

describe('secretarySystemPrompt', () => {
  const prompt = secretarySystemPrompt();

  it('forbids inventing anything outside the alerts it receives', () => {
    // La frontera entera del secretario: no detecta, resume lo ya detectado.
    expect(prompt).toContain('NO inventes');
    expect(prompt).toMatch(/solo.*avisos que te paso/i);
  });

  it('asks for one short paragraph, not a report', () => {
    expect(prompt).toMatch(/una? sola? (línea|frase)|un solo párrafo/i);
  });
});

describe('secretaryInput', () => {
  it('sends the alerts already calculated, never raw tables', () => {
    const input = JSON.parse(secretaryInput([alert()], NOW)) as {
      alerts: { text: string; severity: string }[];
      today: string;
    };

    expect(input.alerts).toEqual([
      { text: '2 leads sin contactar hace más de 48 h', severity: 'urgent' },
    ]);
    expect(input.today).toContain('2026');
  });

  it('drops the internal ids and links: the model does not need them', () => {
    const raw = secretaryInput([alert()], NOW);
    expect(raw).not.toContain('/admin/leads');
    expect(raw).not.toContain('leads-sin-contactar');
  });
});

describe('isSummaryFresh', () => {
  it('reuses a summary written earlier today', () => {
    expect(isSummaryFresh('2026-09-18T09:00:00.000Z', NOW)).toBe(true);
  });

  it('regenerates once the day rolls over in Buenos Aires', () => {
    expect(isSummaryFresh('2026-09-17T23:00:00.000Z', NOW)).toBe(false);
  });

  it('treats a missing summary as stale', () => {
    expect(isSummaryFresh(null, NOW)).toBe(false);
  });

  it('treats a broken timestamp as stale instead of throwing', () => {
    expect(isSummaryFresh('no-es-una-fecha', NOW)).toBe(false);
  });
});
