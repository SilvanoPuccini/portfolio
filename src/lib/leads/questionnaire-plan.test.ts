import { describe, expect, it } from 'vitest';

import { planQuestionnaire, casillerosCubiertos } from './questionnaire-plan';

const vacio = {
  presupuesto_rango: null,
  plazo: null,
  problema: null,
  que_construir: null,
  service: null,
  service_data: null,
  guia_respuestas: null,
};

describe('casillerosCubiertos', () => {
  it('sin datos no cubre nada', () => {
    expect(casillerosCubiertos(vacio).size).toBe(0);
  });

  it('el presupuesto del formulario cubre el casillero de plata', () => {
    expect(casillerosCubiertos({ ...vacio, presupuesto_rango: 'USD 1000 a 2000' }).has('Presupuesto')).toBe(true);
  });

  it('lo que se contestó en la llamada también cuenta', () => {
    const lead = { ...vacio, guia_respuestas: { 'plata.rango': 'Entre 1000 y 2000' } };
    expect(casillerosCubiertos(lead).has('Presupuesto')).toBe(true);
  });

  it('una respuesta en blanco no cubre nada', () => {
    expect(casillerosCubiertos({ ...vacio, plazo: '   ' }).has('Plazo')).toBe(false);
    expect(casillerosCubiertos({ ...vacio, guia_respuestas: { 'plata.rango': '' } }).has('Presupuesto')).toBe(false);
  });
});

describe('el disparador: qué servicio y por qué no compró', () => {
  it('a quien no eligió servicio se lo pregunta primero', () => {
    const plan = planQuestionnaire(vacio);
    expect(plan[0].key).toBe('servicio');
    expect(plan[0].opciones?.length).toBeGreaterThanOrEqual(6);
  });

  it('a quien ya entró por un servicio no se lo vuelve a preguntar', () => {
    const plan = planQuestionnaire({ ...vacio, service: 'web' });
    expect(plan.map((q) => q.key)).not.toContain('servicio');
  });

  it('lo que elige ahí abre las preguntas de ese servicio', () => {
    // Es la rama: la respuesta cambia lo que se pregunta después.
    const plan = planQuestionnaire(vacio, 'es', 'automatizacion');
    expect(plan.map((q) => q.key)).toContain('origen');
  });

  it('pregunta por qué prefirió hablar antes de contratar', () => {
    // Es la información más cara del negocio: o el catálogo no se entiende,
    // o falta un paquete.
    const pregunta = planQuestionnaire(vacio).find((q) => q.key === 'por_que_llamada');
    expect(pregunta?.opciones?.join(' ').toLowerCase()).toMatch(/no entend|no entra|precio/);
  });

  it('si ya contestó por qué, no se lo repite', () => {
    const plan = planQuestionnaire({ ...vacio, service_data: { por_que_llamada: 'El precio' } });
    expect(plan.map((q) => q.key)).not.toContain('por_que_llamada');
  });
});

describe('planQuestionnaire', () => {
  it('sin datos manda el cuestionario completo, con el disparador adelante', () => {
    const plan = planQuestionnaire(vacio);

    expect(plan.length).toBeGreaterThanOrEqual(9);
    // Primero qué necesita y por qué no lo compró solo; después lo demás.
    expect(plan.slice(0, 2).map((q) => q.fuente)).toEqual(['disparador', 'disparador']);
    expect(plan.slice(2).every((q) => q.fuente === 'calificacion')).toBe(true);
  });

  it('no vuelve a preguntar lo que el cliente ya contestó', () => {
    const plan = planQuestionnaire({ ...vacio, presupuesto_rango: 'USD 1000', plazo: 'Este mes' });
    const casilleros = plan.map((q) => q.para);
    expect(casilleros).not.toContain('Presupuesto');
    expect(casilleros).not.toContain('Plazo');
  });

  it('suma las preguntas del servicio que eligió', () => {
    const plan = planQuestionnaire({ ...vacio, service: 'automatizacion' });
    const delServicio = plan.filter((q) => q.fuente === 'servicio');
    expect(delServicio.length).toBeGreaterThan(0);
    expect(delServicio.every((q) => q.text.trim().length > 0)).toBe(true);
  });

  it('no pregunta lo del servicio que ya vino contestado en el formulario', () => {
    const conServicio = planQuestionnaire({ ...vacio, service: 'automatizacion' });
    const primera = conServicio.find((q) => q.fuente === 'servicio')!;
    const plan = planQuestionnaire({
      ...vacio,
      service: 'automatizacion',
      service_data: { [primera.key]: 'De un mail' },
    });
    expect(plan.find((q) => q.key === primera.key)).toBeUndefined();
  });

  it('las preguntas de elegir viajan con sus opciones', () => {
    const plan = planQuestionnaire({ ...vacio, service: 'automatizacion' });
    const origen = plan.find((q) => q.key === 'origen')!;
    expect(origen.opciones).toContain('De una planilla');
  });

  it('en inglés vienen las preguntas y las opciones traducidas', () => {
    const plan = planQuestionnaire({ ...vacio, service: 'automatizacion' }, 'en');
    expect(plan[0].text).not.toMatch(/¿/);
    expect(plan.find((q) => q.key === 'origen')!.opciones).toContain('From a spreadsheet');
  });

  it('el pedido de contexto siempre va, y va último', () => {
    const plan = planQuestionnaire({ ...vacio, presupuesto_rango: 'x', plazo: 'y', problema: 'z' });
    expect(plan[plan.length - 1].para).toBe('Contexto');
  });

  it('nunca repite una clave', () => {
    const plan = planQuestionnaire({ ...vacio, service: 'web' });
    const keys = plan.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('con todo contestado queda el motivo y el contexto', () => {
    const plan = planQuestionnaire({
      ...vacio,
      presupuesto_rango: 'USD 1000',
      plazo: 'Este mes',
      problema: 'Pierdo pedidos',
      que_construir: 'Una tienda',
      guia_respuestas: {
        'alcance.referencias': 'Probé con Excel',
        'decision.quien': 'Yo',
      },
    });
    // Queda el motivo de la llamada, que no se deduce de ningún otro dato, y
    // el pedido de contexto del final.
    expect(plan.map((q) => q.key)).toEqual(['servicio', 'por_que_llamada', 'q7']);
  });
});
