import { describe, expect, it } from 'vitest';
import {
  CALL_GUIDE, GUIDE_MINUTES, QUALIFICATION, diagnosisFromAnswers, guideProgress,
  missingFromForm, parseAnswers, qualification, qualificationScore, stageProgress, stageSummary,
} from './call-guide';

const stage = (id: string) => CALL_GUIDE.find((s) => s.id === id)!;
const at = (id: string) => CALL_GUIDE.findIndex((s) => s.id === id);

describe('CALL_GUIDE — el orden es la mitad del valor', () => {
  it('entra en los 45 minutos, sin huecos ni superposiciones', () => {
    expect(GUIDE_MINUTES).toBe(45);

    CALL_GUIDE.forEach((s, i) => {
      expect(s.to).toBeGreaterThan(s.from);
      if (i > 0) expect(s.from).toBe(CALL_GUIDE[i - 1].to);
    });
  });

  it('sigue el recorrido de SPIN: situación, problema, valor', () => {
    expect(at('situacion')).toBeLessThan(at('problema'));
    expect(at('problema')).toBeLessThan(at('valor'));
  });

  it('el alcance y la plata van después de entender el problema', () => {
    // Preguntar «qué te construyo» antes del proceso es cómo se venden
    // sistemas que nadie usa; preguntar el precio antes, cómo se regala.
    expect(at('problema')).toBeLessThan(at('alcance'));
    expect(at('alcance')).toBeLessThan(at('plata'));
    expect(stage('alcance').from).toBeGreaterThanOrEqual(24);
    expect(stage('plata').from).toBeGreaterThanOrEqual(36);
  });

  it('cada etapa cierra con un compromiso del cliente', () => {
    for (const s of CALL_GUIDE) {
      expect(s.close.length).toBeGreaterThan(15);
      expect(s.questions.length).toBeGreaterThan(0);
      expect(s.listenFor.length).toBeGreaterThan(10);
    }
  });

  it('termina con un cierre de prueba: se sabe si se vendió antes de cortar', () => {
    const last = CALL_GUIDE[CALL_GUIDE.length - 1];
    expect(last.questions.map((q) => q.id)).toContain('cierre.prueba');
  });

  it('cada pregunta tiene un id único: es la clave con la que se guarda', () => {
    const ids = CALL_GUIDE.flatMap((s) => s.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cubre los seis campos del diagnóstico', () => {
    const fields = CALL_GUIDE.map((s) => s.field).filter(Boolean);
    expect(new Set(fields)).toEqual(new Set([
      'situacion', 'dolor', 'objetivo', 'requerimiento', 'preocupaciones', 'deseo',
    ]));
  });
});

describe('qualification — el semáforo', () => {
  it('sale de lo anotado, no de una pregunta aparte', () => {
    const answers = { 'problema.donde': 'Se pierden pedidos', 'decision.quien': 'Decide ella sola' };

    const checks = qualification(answers);

    expect(checks.find((c) => c.id === 'dolor')?.ok).toBe(true);
    expect(checks.find((c) => c.id === 'decisor')?.ok).toBe(true);
    expect(checks.find((c) => c.id === 'presupuesto')?.ok).toBe(false);
  });

  it('cuenta siete cosas: sin ellas la venta no se sostiene', () => {
    expect(QUALIFICATION).toHaveLength(7);
    expect(qualificationScore({})).toEqual({ ok: 0, total: 7 });
    expect(qualificationScore({ 'problema.costo': 'USD 400 por mes' })).toEqual({ ok: 1, total: 7 });
  });

  it('una respuesta en blanco no cuenta como contestada', () => {
    expect(qualificationScore({ 'problema.costo': '   ' })).toEqual({ ok: 0, total: 7 });
  });
});

describe('stageSummary y diagnosisFromAnswers', () => {
  const answers = {
    'situacion.proceso': 'Toman pedidos por WhatsApp',
    'situacion.gente': 'Tres personas',
    'problema.costo': 'Se pierden 3 pedidos por semana',
  };

  it('el resumen junta pregunta y respuesta, y saltea lo que no se preguntó', () => {
    const summary = stageSummary(stage('situacion'), answers);

    expect(summary).toContain('Toman pedidos por WhatsApp');
    expect(summary).toContain('Tres personas');
    expect(summary).not.toContain('¿Con qué se manejan hoy?');
  });

  it('arma los seis campos del diagnóstico con lo de la llamada', () => {
    const diagnosis = diagnosisFromAnswers(answers);

    expect(diagnosis.situacion).toContain('Toman pedidos por WhatsApp');
    expect(diagnosis.dolor).toContain('3 pedidos por semana');
    expect(diagnosis.objetivo).toBe('');
  });
});

describe('parseAnswers', () => {
  it('limpia lo que viene de la base', () => {
    expect(parseAnswers({ 'a.b': '  hola  ', 'c.d': '   ', 'e.f': 42 })).toEqual({ 'a.b': 'hola' });
  });

  it('aguanta cualquier cosa guardada antes', () => {
    expect(parseAnswers(null)).toEqual({});
    expect(parseAnswers(['a'])).toEqual({});
    expect(parseAnswers('texto')).toEqual({});
  });
});

describe('progreso', () => {
  it('cuenta preguntas, no etapas', () => {
    const total = CALL_GUIDE.flatMap((s) => s.questions).length;
    expect(guideProgress({})).toEqual({ filled: 0, total });
    expect(guideProgress({ 'situacion.gente': 'Tres' }).filled).toBe(1);
  });

  it('cuenta lo respondido de una etapa', () => {
    expect(stageProgress(stage('situacion'), { 'situacion.gente': 'Tres' }))
      .toEqual({ filled: 1, total: stage('situacion').questions.length });
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
    const missing = missingFromForm({ que_construir: 'Una web' });

    expect(missing).toContain('Qué problema lo trajo');
    expect(missing).not.toContain('Qué quiere construir');
  });

  it('un «no» del cliente es una respuesta, no un hueco', () => {
    expect(missingFromForm({ tiene_pagos: false })).not.toContain('Si necesita cobrar online');
    expect(missingFromForm({ tiene_pagos: null })).toContain('Si necesita cobrar online');
  });
});
