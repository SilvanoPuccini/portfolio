import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SERVICIOS } from '@/content/servicios';
import ServiceCatalog from './ServiceCatalog';

describe('ServiceCatalog', () => {
  it('encabeza cada tarjeta con el problema del cliente, no con el nombre del servicio', () => {
    render(<ServiceCatalog locale="es" />);
    const titulos = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titulos).toContain(SERVICIOS[0].problema.es);
  });

  it('lleva a la ficha de cada servicio', () => {
    render(<ServiceCatalog locale="es" />);
    const link = screen.getByRole('link', { name: new RegExp(SERVICIOS[0].problema.es, 'i') });
    expect(link).toHaveAttribute('href', `/es/services/${SERVICIOS[0].slug}`);
  });

  it('muestra los seis servicios', () => {
    render(<ServiceCatalog locale="es" />);
    expect(screen.getAllByRole('link')).toHaveLength(SERVICIOS.length);
  });

  it('dice desde cuánto sale, y a cotizar cuando no hay precio cerrado', () => {
    render(<ServiceCatalog locale="es" />);
    expect(screen.getAllByText(/desde/i).length).toBeGreaterThan(0);
  });

  it('en inglés no queda nada en español', () => {
    render(<ServiceCatalog locale="en" />);
    expect(screen.getByText(SERVICIOS[0].problema.en)).toBeInTheDocument();
    expect(screen.queryByText(SERVICIOS[0].problema.es)).toBeNull();
    expect(screen.getByRole('link', { name: new RegExp(SERVICIOS[0].problema.en, 'i') }))
      .toHaveAttribute('href', `/en/services/${SERVICIOS[0].slug}`);
  });
});
