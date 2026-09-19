import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import GraciasPage, { generateMetadata } from './page';

/**
 * La página a la que Documenso manda al cliente después de firmar.
 *
 * Tiene que confirmar la firma, anticipar el mail de pago y ofrecer agendar el
 * kickoff. El kickoff usa un evento de Cal.com propio: si usara el de la
 * llamada de diagnóstico, el cliente reservaría una llamada de venta.
 */

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

async function renderPage(locale = 'es') {
  render(await GraciasPage(params(locale)));
}

describe('página /gracias', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CALCOM_KICKOFF_LINK;
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
  });

  it('confirma la firma y anticipa el mail de pago', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/contrato firmado/i);
    expect(screen.getByText(/mail con los datos de pago/i)).toBeTruthy();
  });

  it('muestra el calendario del kickoff cuando está configurado', async () => {
    process.env.NEXT_PUBLIC_CALCOM_KICKOFF_LINK = 'https://cal.com/silvano/kickoff';

    await renderPage();

    const frame = screen.getByTitle(/kickoff/i) as HTMLIFrameElement;
    expect(frame.src).toBe('https://cal.com/silvano/kickoff');
  });

  it('nunca usa el calendario de la llamada de diagnóstico', async () => {
    process.env.NEXT_PUBLIC_CALCOM_LINK = 'https://cal.com/silvano/diagnostico';

    await renderPage();

    expect(screen.queryByTitle(/kickoff/i)).toBeNull();
    expect(screen.getByText(/te escribo para coordinar el kickoff/i)).toBeTruthy();
  });

  it('está en inglés para /en', async () => {
    await renderPage('en');

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/contract signed/i);
  });

  it('no se indexa', async () => {
    const metadata = await generateMetadata(params('es'));

    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
