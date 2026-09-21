import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CallGuide } from './CallGuide';
import type { GuideAnswers } from '@/lib/leads/call-guide';

const FORM = { que_construir: 'Un catálogo con stock', problema: 'Pierden pedidos' };

function setup(overrides: {
  answers?: GuideAnswers;
  onAnswer?: (id: string, value: string) => void;
  onApplyModules?: (slugs: string[]) => void;
} = {}) {
  const onAnswer = overrides.onAnswer ?? vi.fn();
  render(
    <CallGuide
      leadId="lead-1"
      form={FORM}
      answers={overrides.answers ?? {}}
      onAnswer={onAnswer}
      onSave={vi.fn()}
      saved={false}
      onApplyModules={overrides.onApplyModules}
    />,
  );
  return { onAnswer };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('CallGuide', () => {
  it('muestra una etapa por vez, empezando por el encuadre', () => {
    // Ocho etapas abiertas son una lista; una sola es una conversación.
    setup();

    expect(screen.getByText(/Contame en qué andás/i)).toBeTruthy();
    expect(screen.queryByText(/qué es lo mínimo que te cambia el día/i)).toBeNull();
  });

  it('cada pregunta tiene su propia casilla', () => {
    const onAnswer = vi.fn();
    setup({ onAnswer });

    fireEvent.click(screen.getByRole('button', { name: /Ir a La situación de hoy/i }));
    fireEvent.change(screen.getByLabelText(/¿Quién más mete mano/i), { target: { value: 'Tres personas' } });

    expect(onAnswer).toHaveBeenCalledWith('situacion.gente', 'Tres personas');
  });

  it('dice con qué cierra cada etapa', () => {
    // El micro-compromiso: si la etapa no cierra, seguir de largo no la arregla.
    setup();

    expect(screen.getByText(/Cerrás cuando:/i)).toBeTruthy();
    expect(screen.getByText(/Acepta la agenda/i)).toBeTruthy();
  });

  it('termina con el cierre de prueba, para saber si se vendió', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /Ir a Cierre de prueba/i }));

    expect(screen.getByText(/¿avanzamos\?/i)).toBeTruthy();
  });

  it('el semáforo se prende con lo anotado, sin preguntar aparte', () => {
    setup({
      answers: {
        'problema.donde': 'Se pierden pedidos',
        'problema.costo': 'USD 400 por mes',
        'decision.quien': 'Decide ella',
      },
    });

    expect(screen.getByText(/Calificación 3\/7/i)).toBeTruthy();
    expect(screen.getByText(/✓ Decisor/i)).toBeTruthy();
    expect(screen.getByText(/· Presupuesto/i)).toBeTruthy();
  });

  it('avisa cuando la venta no se sostiene', () => {
    setup({ answers: { 'problema.donde': 'Algo' } });

    expect(screen.getByText(/se enfría/i)).toBeTruthy();
  });

  it('deja de avisar cuando la venta está calificada', () => {
    setup({
      answers: {
        'problema.donde': 'a', 'problema.costo': 'b', 'problema.porque_ahora': 'c',
        'decision.quien': 'd', 'decision.criterios': 'e', 'plata.rango': 'f', 'plata.cuando': 'g',
      },
    });

    expect(screen.getByText(/Calificación 7\/7/i)).toBeTruthy();
    expect(screen.queryByText(/se enfría/i)).toBeNull();
  });

  it('se avanza y se retrocede entre etapas', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
    expect(screen.getByText(/¿Cómo lo resolvés hoy, sin sistema/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Anterior/i }));
    expect(screen.getByText(/Contame en qué andás/i)).toBeTruthy();
  });

  it('muestra lo que el cliente ya contestó para no repreguntarlo', () => {
    setup();

    expect(screen.getByText(/no lo repreguntes/i)).toBeTruthy();
    expect(screen.getByText(/Un catálogo con stock/i)).toBeTruthy();
  });

  it('avisa qué no contestó en el formulario', () => {
    setup();

    expect(screen.getByText(/Averiguá:/i)).toBeTruthy();
    expect(screen.getByText(/Con qué presupuesto se maneja/i)).toBeTruthy();
  });

  it('sin reconocimiento de voz no muestra el micrófono', () => {
    // Un botón que no hace nada es peor que ningún botón.
    setup();

    expect(screen.queryByRole('button', { name: /Dictar/i })).toBeNull();
  });

  it('carga en el presupuesto los módulos que la IA recomendó', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        problema: 'x', solucion: 'y', confianza: 'alta', falta_preguntar: [],
        no_ofrecer: [], objeciones: [],
        modulos: [{ slug: 'catalogo', porque: 'Resuelve el problema' }],
      }),
    }));
    const onApplyModules = vi.fn();
    setup({ onApplyModules });

    fireEvent.click(screen.getByRole('button', { name: /Qué ofrecerle/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Cargar en el presupuesto/i }));

    expect(onApplyModules).toHaveBeenCalledWith(['catalogo']);
  });

  it('si no hay cuota lo dice y la guía sigue usable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, json: async () => ({ error: 'Sin cuota' }),
    }));

    setup();
    fireEvent.click(screen.getByRole('button', { name: /Qué ofrecerle/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin cuota');
    expect(screen.getByText(/Contame en qué andás/i)).toBeTruthy();
  });
});
