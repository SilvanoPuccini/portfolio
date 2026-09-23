import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { FirmaContrato } from './FirmaContrato';

/**
 * Lo que pasa después de apretar «Firmar».
 *
 * Firmaba, el endpoint respondía bien y la página hacía `reload()`. El
 * cliente veía la misma pantalla del contrato volver a aparecer, con el mismo
 * botón, y no tenía forma de saber si había firmado. Y si volvía atrás caía
 * otra vez en el formulario de firma de algo ya firmado.
 */

const CLAUSULAS = [
  { numero: '1', titulo: 'Objeto', parrafos: ['Una landing de una sección.'] },
];

function firmar() {
  fireEvent.change(screen.getByPlaceholderText('Estefanía Ortigosa'), {
    target: { value: 'Estefanía Ortigosa' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Firmar el contrato/i }));
}

const replace = vi.fn();

const locationReal = window.location;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname: '/es/pedido/abc', replace },
  });
});

describe('FirmaContrato', () => {
  it('lleva al paso siguiente en vez de recargar en el lugar', async () => {
    render(<FirmaContrato pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} />);

    firmar();

    // `replace` y no `assign`: el paso de firma no queda en el historial, así
    // que volver atrás no lo devuelve a firmar algo que ya firmó.
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/es/pedido/abc'));
  });

  it('avisa del error sin moverlo de página', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'El nombre tiene que coincidir con el del contrato.' }),
    }));

    render(<FirmaContrato pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} />);
    firmar();

    expect(await screen.findByRole('alert')).toHaveTextContent('tiene que coincidir');
    expect(replace).not.toHaveBeenCalled();
  });

  it('deja volver a intentar después de un error', async () => {
    // El botón quedaba deshabilitado y no había forma de reintentar sin
    // recargar a mano, justo cuando el cliente ya decidió comprar.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('se cortó')));

    render(<FirmaContrato pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} />);
    firmar();

    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /Firmar el contrato/i })).toBeEnabled();
  });

  it('el botón no se puede apretar sin haber leído ni escrito el nombre', () => {
    render(<FirmaContrato pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} />);

    expect(screen.getByRole('button', { name: /Firmar el contrato/i })).toBeDisabled();
  });

  it('si le pasan qué hacer al firmar, no navega por su cuenta', async () => {
    const onFirmado = vi.fn();
    render(
      <FirmaContrato
        pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} onFirmado={onFirmado}
      />,
    );

    firmar();

    await waitFor(() => expect(onFirmado).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });

  /**
   * El cliente tiene que saber que no depende de esta pestaña.
   *
   * El link del pedido es un uuid que vive en la barra del navegador. Quien
   * no sabe que le llegó por correo, cierra la página y da la compra por
   * perdida: ya le pasó a alguien probando el circuito.
   */
  it('avisa que el link también le llegó por correo', () => {
    render(
      <FirmaContrato
        pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS}
        email="este@ejemplo.com"
      />,
    );

    expect(screen.getByText(/este@ejemplo.com/)).toBeInTheDocument();
    expect(screen.getByText(/cerrás esta página/i)).toBeInTheDocument();
  });

  it('sin el correo a mano, lo dice igual sin inventarlo', () => {
    render(<FirmaContrato pedidoId="abc" nombreEsperado="Estefanía Ortigosa" clausulas={CLAUSULAS} />);

    expect(screen.getByText(/cerrás esta página/i)).toBeInTheDocument();
  });
});

/**
 * `window.location` se repone al terminar.
 *
 * Pisarlo sin restaurarlo deja el objeto falso puesto para todo lo que corra
 * después en el mismo worker de jsdom, y el que se rompe es otro archivo,
 * lejos de acá. Un test que ensucia el entorno hace fallar a un inocente.
 */
afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: locationReal });
});
