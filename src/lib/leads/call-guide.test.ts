import { describe, expect, it } from 'vitest';
import {
  CALL_GUIDE, GUIDE_MINUTES, guideProgress, isBlockDone, missingFromForm,
} from './call-guide';

describe('CALL_GUIDE', () => {
  it('entra en la llamada de 45 minutos sin huecos ni superposiciones', () => {
    expect(GUIDE_MINUTES).toBe(45);

    CALL_GUIDE.forEach((block, i) => {
      expect(block.to).toBeGreaterThan(block.from);
      if (i > 0) expect(block.from).toBe(CALL_GUIDE[i - 1].to);
    });
  });

  it('pregunta por el alcance recién después de entender el problema', () => {
    // El orden es la mitad del valor de la guía: preguntar «qué te construyo»
    // antes de entender el proceso es cómo se venden sistemas que nadie usa.
    const at = (id: string) => CALL_GUIDE.findIndex((block) => block.id === id);

    expect(at('situacion')).toBeLessThan(at('dolor'));
    expect(at('dolor')).toBeLessThan(at('requerimiento'));
    expect(at('objetivo')).toBeLessThan(at('requerimiento'));
  });

  it('cubre los seis campos del diagnóstico, uno por bloque', () => {
    const fields = CALL_GUIDE.map((b) => b.field).filter(Boolean);

    expect(new Set(fields)).toEqual(new Set([
      'situacion', 'dolor', 'objetivo', 'deseo', 'requerimiento', 'preocupaciones',
    ]));
    expect(fields.length).toBe(6);
  });

  it('cada bloque trae preguntas y qué escuchar', () => {
    for (const block of CALL_GUIDE) {
      expect(block.questions.length).toBeGreaterThan(0);
      expect(block.listenFor.length).toBeGreaterThan(10);
    }
  });

  it('pregunta quién decide la compra', () => {
    // Sin esto la propuesta se manda a alguien que no puede aprobarla.
    const texto = CALL_GUIDE.flatMap((b) => [...b.questions, ...b.flags]).join(' ').toLowerCase();
    expect(texto).toContain('decide');
  });
});

describe('guideProgress', () => {
  it('cuenta los campos ya cargados', () => {
    expect(guideProgress({})).toEqual({ filled: 0, total: 6 });
    expect(guideProgress({ situacion: 'Toman pedidos por WhatsApp', dolor: '  ' }))
      .toEqual({ filled: 1, total: 6 });
  });
});

describe('isBlockDone', () => {
  const situacion = CALL_GUIDE.find((b) => b.id === 'situacion')!;
  const apertura = CALL_GUIDE.find((b) => b.id === 'apertura')!;

  it('un bloque con su campo escrito está hecho', () => {
    expect(isBlockDone(situacion, { situacion: 'Excel y WhatsApp' })).toBe(true);
    expect(isBlockDone(situacion, { situacion: '' })).toBe(false);
  });

  it('los bloques que no anotan nada nunca se marcan', () => {
    expect(isBlockDone(apertura, { situacion: 'algo' })).toBe(false);
  });
});

describe('missingFromForm', () => {
  it('con el formulario completo no falta nada', () => {
    expect(missingFromForm({
      que_construir: 'Un catálogo', problema: 'Pierden pedidos', secciones: 'Home, catálogo',
      presupuesto_rango: 'USD 3000-5000', plazo: '2 meses', tiene_login: true,
      tiene_pagos: false, tiene_admin: 'sí', integraciones: ['MercadoPago'],
      tiene_marca: true, tiene_contenido: false,
    })).toEqual([]);
  });

  it('un formulario a medias deja la lista de lo que hay que averiguar', () => {
    // El caso real: reservó la llamada sin completar casi nada.
    const missing = missingFromForm({ que_construir: 'Una web' });

    expect(missing).toContain('Qué problema lo trajo');
    expect(missing).toContain('Con qué presupuesto se maneja');
    expect(missing).not.toContain('Qué quiere construir');
  });

  it('un «no» del cliente es una respuesta, no un hueco', () => {
    // false es una decisión tomada; null es que nadie preguntó.
    expect(missingFromForm({ tiene_pagos: false })).not.toContain('Si necesita cobrar online');
    expect(missingFromForm({ tiene_pagos: null })).toContain('Si necesita cobrar online');
  });
});
