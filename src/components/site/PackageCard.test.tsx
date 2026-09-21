import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { paquetePorSlug, servicioPorSlug } from '@/content/servicios';
import PackageCard from './PackageCard';

const auditoria = paquetePorSlug('auditoria-web')!;
const web = paquetePorSlug('web-cinco-secciones')!;
const servicioWeb = servicioPorSlug('web')!;

describe('PackageCard', () => {
  it('muestra precio, plazo, qué incluye y qué no', () => {
    render(<PackageCard locale="es" paquete={web} extras={[]} />);
    expect(screen.getByText(/790/)).toBeInTheDocument();
    expect(screen.getByText(/10 días/i)).toBeInTheDocument();
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
