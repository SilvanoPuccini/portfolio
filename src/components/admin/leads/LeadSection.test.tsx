import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadSection } from './LeadSection';

const renderSection = (defaultOpen: boolean, hint?: string) =>
  render(
    <LeadSection title="Diagnóstico de la llamada" defaultOpen={defaultOpen} hint={hint}>
      <p>contenido de la sección</p>
    </LeadSection>,
  );

describe('LeadSection', () => {
  it('muestra el contenido de la fase activa', () => {
    renderSection(true);
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
    expect(screen.getByText('contenido de la sección')).toBeVisible();
  });

  it('marca cuál es la sección que toca ahora', () => {
    renderSection(true);
    expect(screen.getByText('Ahora')).toBeInTheDocument();
  });

  it('pliega las secciones que no corresponden a la fase', () => {
    renderSection(false);
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    expect(screen.getByText('contenido de la sección')).not.toBeVisible();
  });

  it('no esconde nada: cualquier sección se abre con un clic', () => {
    renderSection(false);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('contenido de la sección')).toBeVisible();
  });

  it('mantiene el contenido montado al plegarse', () => {
    // Desmontarlo perdería lo que haya a medio escribir en la calculadora o
    // en el diagnóstico cada vez que se cierra la sección.
    renderSection(true);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('contenido de la sección')).toBeInTheDocument();
  });

  it('adelanta en el encabezado qué hay adentro mientras está cerrada', () => {
    renderSection(false, 'Cargado el 12 de septiembre');
    expect(screen.getByText('Cargado el 12 de septiembre')).toBeInTheDocument();
  });

  it('no repite la pista cuando la sección ya está abierta', () => {
    renderSection(true, 'Cargado el 12 de septiembre');
    expect(screen.queryByText('Cargado el 12 de septiembre')).toBeNull();
  });
});
