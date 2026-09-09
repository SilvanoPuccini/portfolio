import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('copies the full text and reports success', async () => {
    writeText.mockResolvedValue(undefined);
    const text = `Beginning\n${'full content '.repeat(100)}\nEnd`;

    render(<CopyButton text={text} ariaLabel="Copiar texto completo" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar texto completo' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(text));
    expect(screen.getByText('✓ Copiado')).toBeInTheDocument();
  });

  it('reports clipboard failures visibly', async () => {
    writeText.mockRejectedValue(new Error('Permission denied'));

    render(<CopyButton text="Contenido" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));

    expect(await screen.findByText('No se pudo copiar')).toBeInTheDocument();
  });

  it('is a disabled non-submit button when text is empty', () => {
    render(<CopyButton text="   " ariaLabel="Copiar contenido" />);

    const button = screen.getByRole('button', { name: 'Copiar contenido' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('type', 'button');
  });
});
