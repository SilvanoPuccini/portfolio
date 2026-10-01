import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostLink } from './PostLink';

describe('PostLink', () => {
  it('abre en otra pestaña un link a otro sitio, sin perder el post', () => {
    render(<PostLink href="https://docs.docker.com/engine/security/">seguridad</PostLink>);
    const link = screen.getByRole('link', { name: 'seguridad' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each([
    '/es/blog/deploy-no-es-subir-una-carpeta',
    '#que-necesita-la-aplicacion',
    'https://www.silvanopuccini.dev/es/blog/otro-post',
    'https://silvanopuccini.dev/es/',
    'mailto:hola@silvanopuccini.dev',
  ])('deja en la misma pestaña un link propio: %s', (href) => {
    render(<PostLink href={href}>propio</PostLink>);
    expect(screen.getByRole('link', { name: 'propio' })).not.toHaveAttribute('target');
  });

  it('conserva los atributos que trae el markdown', () => {
    render(<PostLink href="https://docs.docker.com/" title="Docs">docs</PostLink>);
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('title', 'Docs');
  });
});
