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

  /**
   * Lo que el cliente ya escribió también cuenta.
   *
   * El semáforo arrancaba en 0/7 aunque el cliente hubiera contestado seis
   * preguntas por escrito la semana anterior. Decía «esta venta no se sostiene»
   * sobre una venta con el presupuesto, el plazo y el decisor sabidos.
   */
  it('marca lo que el cliente contestó por escrito antes de la llamada', () => {
    const checks = qualification({}, { 'plata.rango': 'Entre 1500 y 2500' });

    expect(checks.find((c) => c.id === 'presupuesto')?.ok).toBe(true);
    expect(checks.find((c) => c.id === 'presupuesto')?.estado).toBe('escrito');
  });

  it('distingue lo escrito de lo confirmado hablando', () => {
    // No es lo mismo: un rango tipeado en un formulario todavía no se miró a
    // la cara. La llamada lo confirma, y el semáforo tiene que poder mostrarlo.
    const checks = qualification(
      { 'plata.rango': 'Cerramos en 2000' },
      { 'plata.rango': 'Entre 1500 y 2500' },
    );

    expect(checks.find((c) => c.id === 'presupuesto')?.estado).toBe('hablado');
  });

  it('deja en vacío lo que no contestó por ningún lado', () => {
    const checks = qualification({}, { 'plata.rango': 'Entre 1500 y 2500' });

    expect(checks.find((c) => c.id === 'decisor')?.estado).toBe('vacio');
    expect(checks.find((c) => c.id === 'decisor')?.ok).toBe(false);
  });

  it('suma lo escrito al puntaje: si ya lo sabés, lo sabés', () => {
    expect(qualificationScore({}, {
      'plata.rango': 'Entre 1500 y 2500',
      'plata.cuando': 'Antes del verano',
      'decision.quien': 'Lo decido con mi socio',
    })).toEqual({ ok: 3, total: 7 });
  });

  it('no cuenta dos veces lo mismo contestado por escrito y hablado', () => {
    expect(qualificationScore(
      { 'plata.rango': 'Cerramos en 2000' },
      { 'plata.rango': 'Entre 1500 y 2500' },
    )).toEqual({ ok: 1, total: 7 });
  });

  it('una previa en blanco no marca nada', () => {
    expect(qualificationScore({}, { 'plata.rango': '   ' })).toEqual({ ok: 0, total: 7 });
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

/**
 * Lo que falta averiguar antes de poder cotizar.
 *
 * Pedía once cosas, de las cuales diez no las llena nadie: venían del
 * formulario largo que el sitio dejó de tener. El panel avisaba «averiguá si
 * necesita usuarios y login» en TODA llamada, para siempre. Un aviso que
 * siempre grita es un aviso que se aprende a ignorar, y ahí se pierden también
 * los que sí importaban.
 *
 * Quedan los cuatro que deciden si la venta se puede cotizar y que el circuito
 * de verdad llena: el cuestionario los vuelca a la venta al contestarse. Lo
 * técnico no se perdió — login y cobros los define el paquete del catálogo,
 * las integraciones las pregunta la guía en su etapa de alcance, y la marca,
 * el contenido y las secciones los pide el kickoff con el detalle real, ya
 * vendido.
 */
describe('missingFromForm', () => {
  it('con lo que hace falta para cotizar, no falta nada', () => {
    expect(missingFromForm({
      que_construir: 'Un catálogo', problema: 'Pierden pedidos',
      presupuesto_rango: 'USD 3000-5000', plazo: '2 meses',
    })).toEqual([]);
  });

  it('un formulario a medias deja la lista de lo que hay que averiguar', () => {
    const missing = missingFromForm({ que_construir: 'Una web' });

    expect(missing).toContain('Qué problema lo trajo');
    expect(missing).not.toContain('Qué quiere construir');
  });

  it('no pide lo que ningún formulario llena', () => {
    const missing = missingFromForm({});

    expect(missing).not.toContain('Si necesita usuarios y login');
    expect(missing).not.toContain('Si necesita cobrar online');
    expect(missing).not.toContain('Si necesita panel de administración');
    expect(missing).not.toContain('Si ya tiene marca y diseño');
    expect(missing).not.toContain('Si ya tiene el contenido');
    expect(missing).not.toContain('Qué secciones o pantallas necesita');
    expect(missing).not.toContain('Con qué sistemas hay que conectarlo');
  });

  it('un lead recién entrado pide cuatro cosas, no once', () => {
    expect(missingFromForm({})).toHaveLength(4);
  });

  it('el cuestionario contestado apaga el aviso', () => {
    // Las cuatro llegan volcadas desde el cuestionario previo a la llamada.
    expect(missingFromForm({
      que_construir: 'Anoto los pedidos en un cuaderno',
      problema: 'Pierdo 2 horas por día',
      plazo: 'Antes del verano',
      presupuesto_rango: 'Entre 1500 y 2500',
    })).toEqual([]);
  });

  it('un espacio en blanco no apaga nada', () => {
    expect(missingFromForm({ problema: '   ' })).toContain('Qué problema lo trajo');
  });
});
