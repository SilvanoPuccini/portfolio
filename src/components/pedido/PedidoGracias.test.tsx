import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PedidoGracias } from './PedidoGracias';
import { lineaDeTiempo } from '@/lib/leads/linea-de-tiempo';

/**
 * El cierre de la compra. El cliente cargaba el material y se quedaba con un
 * cartel de «Listo»: pagó y no sabía qué venía ni cuándo.
 */

const pasos = lineaDeTiempo({
  cobradoAt: '2026-09-24T14:00:00-03:00',
  materialAt: '2026-09-25T10:00:00-03:00',
  plazoMaximo: 10,
  espera: 0,
  locale: 'es',
});

describe('PedidoGracias', () => {
  it('agradece por su nombre y nombra lo que compró', () => {
    render(<PedidoGracias pedidoId="p1" nombre="Force Corp" paquete="Landing" pasos={pasos}
      factura={null} contacto="silvano@ejemplo.com" locale="es" />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('¡Gracias, Force! Tu Landing ya está en marcha');
  });

  it('muestra el camino con la fecha de entrega', () => {
    render(<PedidoGracias pedidoId="p1" nombre="Ana" paquete="Landing" pasos={pasos}
      factura={null} contacto={null} locale="es" />);

    expect(screen.getByText('Entrega')).toBeInTheDocument();
    expect(screen.getByText(/hasta el .* de octubre/)).toBeInTheDocument();
    expect(screen.getByText('30 días de garantía')).toBeInTheDocument();
  });

  it('deja a mano el contrato y un canal para escribir', () => {
    render(<PedidoGracias pedidoId="p1" nombre="Ana" paquete="Landing" pasos={pasos}
      factura="0001-00000042" contacto="silvano@ejemplo.com" locale="es" />);

    expect(screen.getByRole('link', { name: /contrato firmado/i })).toHaveAttribute('href', '/api/pedido/p1/contrato-firmado');
    expect(screen.getByRole('link', { name: /escribirme/i })).toHaveAttribute('href', 'mailto:silvano@ejemplo.com');
    expect(screen.getByText('Factura 0001-00000042')).toBeInTheDocument();
  });
});
