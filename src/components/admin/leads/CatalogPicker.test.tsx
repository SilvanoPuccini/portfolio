import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CatalogPicker } from './CatalogPicker';

const base = {
  paqueteSlug: null as string | null,
  extrasIds: [] as string[],
  onPaquete: vi.fn(),
  onExtra: vi.fn(),
};

describe('CatalogPicker', () => {
  it('ofrece los paquetes del catálogo con su precio', () => {
    render(<CatalogPicker {...base} />);
    const select = screen.getByLabelText(/paquete/i) as HTMLSelectElement;
    const textos = Array.from(select.options).map((o) => o.textContent ?? '');
    expect(textos.some((t) => t.includes('Web de cinco secciones') && t.includes('790'))).toBe(true);
    expect(textos.some((t) => t.includes('Sin paquete'))).toBe(true);
  });

  it('elegir un paquete avisa hacia arriba', () => {
    render(<CatalogPicker {...base} />);
    fireEvent.change(screen.getByLabelText(/paquete/i), { target: { value: 'landing' } });
    expect(base.onPaquete).toHaveBeenCalledWith('landing');
  });

  it('sin paquete no muestra extras', () => {
    render(<CatalogPicker {...base} />);
    expect(screen.queryByText(/agenda de turnos/i)).toBeNull();
  });

  it('con paquete muestra los extras de ese servicio y no los de otro', () => {
    render(<CatalogPicker {...base} paqueteSlug="web-cinco-secciones" />);
    expect(screen.getByLabelText(/agenda de turnos/i)).toBeTruthy();
    expect(screen.queryByLabelText(/zonas de envío/i)).toBeNull();
  });

  it('tildar un extra avisa hacia arriba', () => {
    const onExtra = vi.fn();
    render(<CatalogPicker {...base} paqueteSlug="web-cinco-secciones" onExtra={onExtra} />);
    fireEvent.click(screen.getByLabelText(/agenda de turnos/i));
    expect(onExtra).toHaveBeenCalledWith('agenda', true);
  });

  it('un paquete a cotizar avisa que el número sale de la estimación', () => {
    render(<CatalogPicker {...base} paqueteSlug="tienda-a-medida" />);
    expect(screen.getByText(/se cotiza/i)).toBeTruthy();
  });
});
