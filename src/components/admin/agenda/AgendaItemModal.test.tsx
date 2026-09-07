import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgendaItemModal } from './AgendaItemModal';

describe('AgendaItemModal', () => {
  it('prefills the schedule selected in the calendar', () => {
    render(
      <AgendaItemModal
        initialScheduledAt="2026-09-13T10:00"
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Programado para')).toHaveValue('2026-09-13T10:00');
  });
});
