import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ServicesPage from './page';
import { SERVICIOS } from '@/content/servicios';

const render_ = async (locale = 'es') =>
  render(await ServicesPage({ params: Promise.resolve({ locale }) }));

describe('la página de servicios', () => {
  it('lista los servicios por el problema que resuelven', async () => {
    await render_();
    for (const servicio of SERVICIOS) {
      expect(screen.getByText(servicio.problema.es)).toBeInTheDocument();
    }
  });

  it('no trae el formulario adentro: cada ficha tiene el suyo', async () => {
    await render_();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/paso 1/i)).toBeNull();
  });

  it('cada servicio lleva a su ficha', async () => {
    await render_();
    const link = screen.getByRole('link', { name: new RegExp(SERVICIOS[0].problema.es, 'i') });
    expect(link).toHaveAttribute('href', `/es/services/${SERVICIOS[0].slug}`);
  });

  it('en inglés lista los mismos servicios en inglés', async () => {
    await render_('en');
    expect(screen.getByText(SERVICIOS[0].problema.en)).toBeInTheDocument();
  });
});
