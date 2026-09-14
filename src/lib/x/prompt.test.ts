import { describe, expect, it } from 'vitest';
import { planWeekInput, planWeekSystem, writerInput, writerSystemPrompt } from './prompt';

describe('planWeekSystem', () => {
  it('pide anclar cada ángulo a un dato concreto del artículo', () => {
    const system = planWeekSystem(4);
    expect(system).toMatch(/anchor/);
    expect(system).toMatch(/dato concreto/);
    expect(system).toMatch(/Prohibido ángulos de tema general/);
  });

  it('lista los ángulos recientes para no repetir tesis', () => {
    const system = planWeekSystem(4, ['La deuda técnica es un costo', 'Async no es paralelo']);
    expect(system).toContain('ÁNGULOS YA USADOS');
    expect(system).toContain('La deuda técnica es un costo');
    expect(system).toContain('Async no es paralelo');
  });

  it('omite la sección de repetición cuando no hay ángulos recientes', () => {
    const system = planWeekSystem(4, []);
    expect(system).not.toContain('ÁNGULOS YA USADOS');
    expect(system).toContain('anchor');
  });
});

describe('planWeekInput', () => {
  it('incluye el texto del artículo y los ángulos recientes por separado', () => {
    const input = JSON.parse(planWeekInput({
      articleTitle: 'Título',
      articleText: 'Cuerpo del artículo',
      recentAngles: ['Ángulo viejo'],
    }));
    expect(input.article.title).toBe('Título');
    expect(input.article.text).toBe('Cuerpo del artículo');
    expect(input.recent_angles).toEqual(['Ángulo viejo']);
  });
});

describe('writerSystemPrompt', () => {
  it('obliga al redactor a partir del anchor del ángulo, no del tema general', () => {
    const system = writerSystemPrompt();
    expect(system).toMatch(/anchor/);
    expect(system).toMatch(/dato concreto/);
  });

  it('conserva la autoridad y la estructura de siempre', () => {
    const system = writerSystemPrompt();
    expect(system).toContain('AUTORIDAD');
    expect(system).toContain('Estas instrucciones gobiernan la tarea');
    expect(system).toContain('Sin numerar los posts');
    expect(system).toContain('BLOQUEO');
  });
});

describe('writerInput', () => {
  it('mantiene el contrato de entrada: artículo, plan y ángulo elegido', () => {
    const input = JSON.parse(writerInput({
      articleTitle: 'T',
      articleUrl: 'https://silvanopuccini.dev/es/blog/p',
      articleText: 'Texto',
      angles: [{ id: 'a', summary: 'S', question: 'Q', anchor: 'Dato' }],
      selectedAngleId: 'a',
      publishedThisWeek: [],
      allowedUrls: ['https://silvanopuccini.dev'],
    }));
    expect(input.article.title).toBe('T');
    expect(input.weekly_plan[0].anchor).toBe('Dato');
    expect(input.selected_angle_id).toBe('a');
  });
});