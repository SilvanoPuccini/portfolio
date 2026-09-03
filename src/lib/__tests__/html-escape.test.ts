import { describe, expect, it } from 'vitest';
import { escapeHtml } from '@/lib/html-escape';
import { newLeadHtml } from '@/lib/email-templates/new-lead';

describe('escapeHtml', () => {
  it('neutraliza marcado', () => {
    expect(escapeHtml('<a href="x">hola</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;hola&lt;/a&gt;',
    );
  });

  it('escapa el & primero, para no romper las otras entidades', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('tolera null y undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('newLeadHtml — el contenido viene de un formulario público', () => {
  const phishing = '<a href="https://phishing.example/">Ver lead completo</a>';

  const html = newLeadHtml({
    name: phishing,
    email: '"><script>x</script>@test.com',
    service: null,
    project_type: null,
    created_at: new Date('2026-09-06T10:00:00-03:00').toISOString(),
  });

  it('no deja pasar un link inyectado en el nombre', () => {
    expect(html).not.toContain('href="https://phishing.example/"');
    expect(html).toContain('&lt;a href=&quot;https://phishing.example/&quot;&gt;');
  });

  it('no deja pasar marcado inyectado en el email', () => {
    expect(html).not.toContain('<script>');
  });
});
