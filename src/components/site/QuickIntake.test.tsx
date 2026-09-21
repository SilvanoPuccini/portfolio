import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QuickIntake from './QuickIntake';

const CAL = 'https://cal.com/silvano/diagnostico';

const completar = () => {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Estefanía' } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'este@ferrelon.com' } });
  fireEvent.change(screen.getByLabelText(/whatsapp/i), { target: { value: '+5493511234567' } });
  fireEvent.change(screen.getByLabelText(/necesitás/i), { target: { value: 'Pierdo pedidos' } });
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'lead-1' }) }));
});
afterEach(() => vi.unstubAllGlobals());

describe('QuickIntake', () => {
  it('pide los datos antes de mostrar el calendario', () => {
    render(<QuickIntake locale="es" calcomLink={CAL} />);
    expect(screen.queryByTitle(/agendar/i)).toBeNull();
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
  });

  it('crea el lead con el servicio y el paquete elegidos', async () => {
    render(<QuickIntake locale="es" calcomLink={CAL} service="tienda" paquete="catalogo-cobro" />);
    completar();
    fireEvent.click(screen.getByRole('button', { name: /ver horarios/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/leads');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      nombre: 'Estefanía',
      email: 'este@ferrelon.com',
      service: 'tienda',
      problema: 'Pierdo pedidos',
    });
    expect(body.service_data).toMatchObject({ paquete: 'catalogo-cobro' });
  });

  it('con el lead creado muestra el calendario con los datos ya puestos', async () => {
    render(<QuickIntake locale="es" calcomLink={CAL} />);
    completar();
    fireEvent.click(screen.getByRole('button', { name: /ver horarios/i }));

    const iframe = await screen.findByTitle(/agendar/i);
    expect(iframe.getAttribute('src')).toContain('name=Estefan');
    expect(iframe.getAttribute('src')).toContain('este%40ferrelon.com');
  });

  it('si el alta falla lo dice y no borra lo escrito', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'no' }) } as Response);
    render(<QuickIntake locale="es" calcomLink={CAL} />);
    completar();
    fireEvent.click(screen.getByRole('button', { name: /ver horarios/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect((screen.getByLabelText(/nombre/i) as HTMLInputElement).value).toBe('Estefanía');
  });

  it('sin calendario configurado ofrece escribir un mail', () => {
    render(<QuickIntake locale="es" calcomLink={null} email="hola@silvano.dev" />);
    expect(screen.getByRole('link', { name: /mail/i })).toHaveAttribute('href', 'mailto:hola@silvano.dev');
  });

  it('en inglés el formulario se lee en inglés', () => {
    render(<QuickIntake locale="en" calcomLink={CAL} />);
    expect(screen.getByRole('button', { name: /see available times/i })).toBeInTheDocument();
  });
});
