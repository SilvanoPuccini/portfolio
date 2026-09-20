import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CallGuide } from './CallGuide';

const FORM = { que_construir: 'Un catálogo con stock', problema: 'Pierden pedidos' };

function setup(overrides: Partial<Parameters<typeof CallGuide>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <CallGuide
      leadId="lead-1"
      form={FORM}
      values={{}}
      onChange={onChange}
      onSave={vi.fn()}
      saved={false}
      {...overrides}
    />,
  );
  return { onChange };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('CallGuide', () => {
  it('arranca por la apertura, no por el alcance', () => {
    setup();

    expect(screen.getByText(/Contame en qué andás/i)).toBeTruthy();
    expect(screen.queryByText(/qué es lo mínimo que te cambia el día/i)).toBeNull();
  });

  it('muestra qué escuchar y las señales de alerta del bloque abierto', () => {
    setup();

    expect(screen.getByText(/Las primeras tres frases/i)).toBeTruthy();
    expect(screen.getByText(/sin entender el alcance/i)).toBeTruthy();
  });

  it('lo anotado va al campo de diagnóstico que ya existe', () => {
    // La guía no guarda nada aparte: es la misma ficha, en otro orden.
    const { onChange } = setup();

    fireEvent.click(screen.getByRole('button', { name: /La situación de hoy/i }));
    fireEvent.change(screen.getByLabelText(/Anotar La situación de hoy/i), {
      target: { value: 'Toman pedidos por WhatsApp' },
    });

    expect(onChange).toHaveBeenCalledWith('situacion', 'Toman pedidos por WhatsApp');
  });

  it('avisa qué no contestó el cliente en el formulario', () => {
    setup();

    expect(screen.getByText(/No lo contestó en el formulario/i)).toBeTruthy();
    expect(screen.getByText(/Con qué presupuesto se maneja/i)).toBeTruthy();
  });

  it('lleva la cuenta de lo cargado', () => {
    setup({ values: { situacion: 'Excel', dolor: 'Pierden pedidos' } });

    expect(screen.getByText(/2 de 6 cargados/i)).toBeTruthy();
  });

  it('pide la recomendación y muestra primero lo que falta preguntar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        problema: 'Pierden pedidos por WhatsApp',
        solucion: 'Catálogo con stock',
        modulos: [{ slug: 'catalogo', porque: 'Resuelve el problema' }],
        no_ofrecer: [{ que: 'Pagos online', porque: 'No lo pidió' }],
        objeciones: [{ objecion: 'Es caro', respuesta: 'Compararlo con lo que pierden' }],
        falta_preguntar: ['Quién decide la compra'],
        confianza: 'media',
      }),
    }));

    setup();
    fireEvent.click(screen.getByRole('button', { name: /Qué ofrecerle/i }));

    expect(await screen.findByText(/Quién decide la compra/i)).toBeTruthy();
    expect(screen.getByText(/Pagos online/i)).toBeTruthy();
    expect(screen.getByText(/confianza media/i)).toBeTruthy();
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
