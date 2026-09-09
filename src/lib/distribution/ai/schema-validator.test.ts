import { describe, expect, it } from 'vitest';
import { validateGeneratedContent } from './schema-validator';

function generated(caption: string, hashtags: string[] = ['arquitectura']) {
  const slide = (type: string, headline: string) => ({ type, headline, body: 'Contenido verificable de la fuente.' });
  return {
    linkedin: {
      slides: [
        slide('portada', 'Decisión'), slide('problema', 'Restricción'),
        ...Array.from({ length: 6 }, (_, index) => ({ ...slide('idea', index === 4 ? 'Tradeoff' : index === 5 ? 'Cuándo no' : `Idea ${index + 1}`), icon_num: index + 1 })),
        { ...slide('resumen', 'Resumen'), points: ['Uno', 'Dos', 'Tres', 'Cuatro'] },
        slide('engagement', '¿Qué costo aceptarías?'),
      ],
      caption,
      hashtags,
    },
    instagram: { slides: [slide('hook', 'Hook'), slide('content', 'Idea'), slide('content', 'Costo'), slide('cta', 'Cierre')], caption: 'Caption de Instagram válido.', hashtags: ['uno', 'dos', 'tres', 'cuatro', 'cinco'] },
    twitter: { tweets: ['Uno', 'Dos', 'Tres'] },
  };
}

describe('LinkedIn generated-content hard checks', () => {
  const validCaption = `Una decisión técnica no elimina el costo: decide dónde pagarlo.\n\n${'Detalle concreto sobre restricciones, consecuencias y límites. '.repeat(11)}`;

  it('accepts the 10-slide structure and at most two technical hashtags', () => {
    expect(validateGeneratedContent(generated(validCaption)).linkedin.slides).toHaveLength(10);
  });

  it('rejects links and excess hashtags without claiming editorial quality', () => {
    expect(() => validateGeneratedContent(generated(`${validCaption} https://example.com`))).toThrow();
    expect(() => validateGeneratedContent(generated(validCaption, ['uno', 'dos', 'tres']))).toThrow();
  });
});
