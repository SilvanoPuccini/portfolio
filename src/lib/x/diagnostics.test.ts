import { describe, expect, it } from 'vitest';
import { formatXReadWarning, formatXVerificationFailure } from '@/lib/x/diagnostics';

describe('X verification diagnostics', () => {
  it('shows the write failure when reading and writing both fail', () => {
    const message = formatXVerificationFailure({
      steps: [
        { step: 'lectura', ok: false, detail: 'read rejected' },
        { step: 'escritura', ok: false, detail: 'upstream write rejected' },
      ],
      hint: 'Revisá las credenciales.',
    });

    expect(message).toBe('escritura falló: upstream write rejected. Revisá las credenciales.');
  });

  it('does not render skipped reads as warnings', () => {
    expect(formatXReadWarning([
      { step: 'lectura', ok: true, skipped: true, detail: 'client-not-enrolled' },
      { step: 'escritura', ok: true },
      { step: 'borrado', ok: true },
    ])).toBe('');
  });

  it('keeps a failed read visible after writing succeeds', () => {
    expect(formatXReadWarning([
      { step: 'lectura', ok: false, detail: 'read rejected' },
      { step: 'escritura', ok: true },
      { step: 'borrado', ok: true },
    ])).toBe('lectura falló: read rejected. La escritura y el borrado sí fueron verificados.');
  });
});
