import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BrumaDemo from './BrumaDemo';
import { WebMarketingIntro, WebMarketingClose } from '@/components/site/WebMarketing';

vi.mock('next/image', () => ({ default: (props: { src: string; alt: string }) => <span role="img" aria-label={props.alt} /> }));

describe('fictional showcase isolation', () => {
  it.each(['es', 'en'] as const)('keeps %s demo actions local and clearly illustrative', (locale) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<BrumaDemo locale={locale} />);
    expect(screen.getByText(/negocio ficticio|fictional business/)).toBeInTheDocument();
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).toMatch(new RegExp(`^(#bruma-|/${locale}/services/web)`));
      fireEvent.click(link);
    }
    expect(container.querySelector('form,input,button')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(container.querySelector('summary')).toHaveTextContent(/reservar|book/);
    vi.unstubAllGlobals();
  });

  it('preview contains no interactive purchase or selection action', () => {
    render(<BrumaDemo locale="en" preview />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it.each(['es', 'en'] as const)('marketing keeps demo separate from package state in %s', (locale) => {
    const { container } = render(<><WebMarketingIntro locale={locale} /><WebMarketingClose locale={locale} /></>);
    expect(screen.getByRole('link', { name: /Explorar el ejemplo|Explore the example/ })).toHaveAttribute('href', `/demo/${locale}/bruma`);
    expect(screen.getByText(/no un cliente real|not a real customer/)).toBeInTheDocument();
    expect(screen.getByText(/no incluye reservas|bookings and a store are not included/)).toBeInTheDocument();
    expect(container.querySelectorAll('details')).toHaveLength(4);
    expect(screen.getByRole('link', { name: /Ver paquetes y precios|See packages and prices/ })).toHaveAttribute('href', '#packages');
  });
});
