import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { paquetePorSlug, servicioPorSlug } from '@/content/servicios';
import PackageCard from './PackageCard';

const auditoria = paquetePorSlug('auditoria-web')!;
const web = paquetePorSlug('web-cinco-secciones')!;
const servicioWeb = servicioPorSlug('web')!;

/** Contesta la calificación con las respuestas que entran en el paquete. */
const calificar = (pkg: typeof web) => {
  for (const pregunta of pkg.calificacion) {
    const opcion = pregunta.opciones.find((o) => o.califica)!;
    fireEvent.click(screen.getByRole('radio', { name: opcion.label.es }));
  }
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ pedidoId: 'pedido-1', url: 'https://documenso.test/d/x?externalId=pedido-1' }),
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('PackageCard', () => {
  it('al contratar registra el pedido con los extras antes de mandar a firmar', async () => {
    render(<PackageCard locale="es" paquete={web} extras={servicioWeb.extras} />);
    calificar(web);
    fireEvent.click(screen.getByLabelText(new RegExp(servicioWeb.extras[0].label.es, 'i')));
    fireEvent.click(screen.getByRole('button', { name: /contratar/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/pedido');
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      paquete: 'web-cinco-secciones',
      extras: [servicioWeb.extras[0].id],
    });
  });

  it('si el pedido falla lo dice y no manda a ningún lado', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    render(<PackageCard locale="es" paquete={web} extras={[]} />);
    calificar(web);
    fireEvent.click(screen.getByRole('button', { name: /contratar/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('muestra precio, plazo, qué incluye y qué no', () => {
    render(<PackageCard locale="es" paquete={web} extras={[]} />);
    expect(screen.getByText(/790/)).toBeInTheDocument();
    expect(screen.getByText(/10 a 15 días hábiles/i)).toBeInTheDocument();
    expect(screen.getByText(web.incluye.es[0])).toBeInTheDocument();
    expect(screen.getByText(web.noIncluye.es[0])).toBeInTheDocument();
  });

  it('sin contestar la calificación, no deja contratar', () => {
    render(<PackageCard locale="es" paquete={auditoria} extras={[]} />);
    expect(screen.getByRole('button', { name: /contratar/i })).toBeDisabled();
  });

  it('contestando dentro del límite, habilita contratar', () => {
    render(<PackageCard locale="es" paquete={auditoria} extras={[]} />);
    for (const pregunta of auditoria.calificacion) {
      const opcion = pregunta.opciones.find((o) => o.califica)!;
      fireEvent.click(screen.getByRole('radio', { name: opcion.label.es }));
    }
    expect(screen.getByRole('button', { name: /contratar/i })).toBeEnabled();
  });

  it('fuera del límite ofrece agendar y dice a dónde va', () => {
    render(<PackageCard locale="es" paquete={auditoria} extras={[]} />);
    const fuera = auditoria.calificacion[0].opciones.find((o) => !o.califica)!;
    fireEvent.click(screen.getByRole('radio', { name: fuera.label.es }));

    expect(screen.queryByRole('button', { name: /contratar/i })).toBeNull();
    expect(screen.getByRole('link', { name: /agendar/i })).toBeInTheDocument();
    expect(screen.getByText(/auditoría de sistema/i)).toBeInTheDocument();
  });

  it('los extras suman al total', () => {
    render(<PackageCard locale="es" paquete={web} extras={servicioWeb.extras} />);
    const extra = servicioWeb.extras[0];
    fireEvent.click(screen.getByLabelText(new RegExp(extra.label.es, 'i')));
    expect(screen.getByText(new RegExp(String(790 + extra.precioUsd)))).toBeInTheDocument();
  });

  it('marca el paquete destacado', () => {
    render(<PackageCard locale="es" paquete={web} extras={[]} />);
    expect(screen.getByText(/el que más se elige/i)).toBeInTheDocument();
  });

  it('un paquete a cotizar no muestra precio ni botón de contratar', () => {
    const aMedida = paquetePorSlug('tienda-a-medida')!;
    render(<PackageCard locale="es" paquete={aMedida} extras={[]} />);
    expect(screen.queryByRole('button', { name: /contratar/i })).toBeNull();
    expect(screen.getByRole('link', { name: /agendar/i })).toBeInTheDocument();
  });

  it('en inglés el paquete se lee en inglés', () => {
    render(<PackageCard locale="en" paquete={web} extras={[]} />);
    expect(screen.getByText(web.nombre.en)).toBeInTheDocument();
    expect(screen.getByText(/business days/i)).toBeInTheDocument();
  });
});
