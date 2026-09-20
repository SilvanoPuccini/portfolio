import { describe, expect, it } from 'vitest';
import { lastContactAt } from './last-contact';

const PROPUESTA = '2026-09-01T12:00:00.000Z';
const SEGUIMIENTO = '2026-09-08T12:00:00.000Z';

describe('lastContactAt', () => {
  it('sin contacto no hay fecha', () => {
    expect(lastContactAt({})).toBeNull();
    expect(lastContactAt({ proposal_sent_at: null, ultimo_contacto_at: null })).toBeNull();
  });

  it('con la propuesta sola, es la propuesta', () => {
    expect(lastContactAt({ proposal_sent_at: PROPUESTA })).toBe(PROPUESTA);
  });

  it('el seguimiento manda sobre la propuesta', () => {
    // Y la fecha de la propuesta sigue estando: no se pisa nada.
    expect(lastContactAt({ proposal_sent_at: PROPUESTA, ultimo_contacto_at: SEGUIMIENTO }))
      .toBe(SEGUIMIENTO);
  });

  it('nunca retrocede: un contacto anterior a la propuesta no cuenta', () => {
    expect(lastContactAt({ proposal_sent_at: SEGUIMIENTO, ultimo_contacto_at: PROPUESTA }))
      .toBe(SEGUIMIENTO);
  });

  it('una fecha rota se ignora en vez de romper la lista', () => {
    expect(lastContactAt({ proposal_sent_at: PROPUESTA, ultimo_contacto_at: 'cualquier cosa' }))
      .toBe(PROPUESTA);
  });
});
