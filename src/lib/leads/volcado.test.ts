import { describe, expect, it } from 'vitest';
import { volcarRespuestas } from './volcado';

/**
 * Lo que el cliente escribió antes de la llamada tiene que llegar a la venta.
 *
 * El cuestionario guardaba todo en `questionnaires.answers`, un jsonb que solo
 * abría la pantalla del cuestionario. La ficha del lead —el semáforo, la guía,
 * lo que falta averiguar, la recomendación— lee las columnas de `leads`. Con
 * las dos mitades sin unir, el cliente contestaba seis preguntas y la llamada
 * arrancaba igual de vacía que si no hubiera contestado nada.
 */

describe('volcarRespuestas — del cuestionario a la venta', () => {
  it('lleva cada respuesta a la columna que la ficha lee', () => {
    const cambios = volcarRespuestas(
      {
        q1: 'Los pedidos me llegan por WhatsApp y los anoto en un cuaderno',
        q2: 'Pierdo 2 horas por día cargando datos',
        q5: 'Antes de la temporada de verano',
        q6: 'Entre 1500 y 2500 dólares',
      },
      {},
    );

    expect(cambios).toEqual({
      que_construir: 'Los pedidos me llegan por WhatsApp y los anoto en un cuaderno',
      problema: 'Pierdo 2 horas por día cargando datos',
      plazo: 'Antes de la temporada de verano',
      presupuesto_rango: 'Entre 1500 y 2500 dólares',
    });
  });

  it('no pisa lo que ya estaba cargado en la venta', () => {
    // Si lo corregí a mano en el panel después de hablar con el cliente, eso
    // vale más que lo que escribió apurado en un formulario.
    const cambios = volcarRespuestas(
      { q6: 'No sé todavía' },
      { presupuesto_rango: 'USD 3000 confirmado en la llamada' },
    );

    expect(cambios).toEqual({});
  });

  it('completa solo el hueco cuando la venta ya tiene parte cargada', () => {
    const cambios = volcarRespuestas(
      { q2: 'Se me caen 3 pedidos por mes', q5: 'Para marzo' },
      { problema: 'Ya lo sabía' },
    );

    expect(cambios).toEqual({ plazo: 'Para marzo' });
  });

  it('ignora una respuesta en blanco: un espacio no es una respuesta', () => {
    const cambios = volcarRespuestas({ q5: '   ', q6: '' }, {});

    expect(cambios).toEqual({});
  });

  it('recorta los espacios de los costados', () => {
    const cambios = volcarRespuestas({ q5: '  Para marzo  ' }, {});

    expect(cambios).toEqual({ plazo: 'Para marzo' });
  });

  it('trata una columna vacía o con espacios como un hueco a llenar', () => {
    const cambios = volcarRespuestas({ q5: 'Para marzo' }, { plazo: '  ' });

    expect(cambios).toEqual({ plazo: 'Para marzo' });
  });

  it('deja afuera las preguntas que no tienen columna propia', () => {
    // q3 (alternativas), q4 (decisor) y q7 (contexto) se leen en la guía desde
    // las respuestas del cuestionario. No tienen columna y no se inventa una.
    const cambios = volcarRespuestas(
      { q3: 'Probé con un Excel', q4: 'Lo decido con mi socio', q7: 'Me gusta el sitio de X' },
      {},
    );

    expect(cambios).toEqual({});
  });

  it('aguanta una respuesta que no sea texto sin romperse', () => {
    const cambios = volcarRespuestas(
      { q5: 42 as unknown as string, q6: null as unknown as string },
      {},
    );

    expect(cambios).toEqual({});
  });

  it('devuelve nada si no le pasan respuestas', () => {
    expect(volcarRespuestas(null, {})).toEqual({});
    expect(volcarRespuestas(undefined, {})).toEqual({});
    expect(volcarRespuestas('texto suelto', {})).toEqual({});
    expect(volcarRespuestas([], {})).toEqual({});
  });
});
