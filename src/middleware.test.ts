import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from './middleware';

const csp = (ruta = 'https://silvanopuccini.dev/es') =>
  middleware(new NextRequest(ruta)).headers.get('content-security-policy') ?? '';

describe('la política de seguridad del navegador', () => {
  it('deja embeber la firma de Documenso', () => {
    // Sin esto el navegador bloquea el iframe y el cliente ve un hueco donde
    // tendría que estar su contrato.
    expect(csp()).toMatch(/frame-src[^;]*app\.documenso\.com/);
  });

  it('sigue dejando el calendario y el mapa', () => {
    const politica = csp();
    expect(politica).toMatch(/frame-src[^;]*cal\.com/);
    expect(politica).toMatch(/frame-src[^;]*openstreetmap\.org/);
  });

  it('no deja que nos embeban a nosotros', () => {
    expect(csp()).toContain("frame-ancestors 'none'");
  });

  it('permite hablar con Documenso desde el navegador', () => {
    // El componente de firma consulta su API mientras el cliente firma.
    expect(csp()).toMatch(/connect-src[^;]*documenso/);
  });
});

describe('middleware — el comprobante del panel', () => {
  it('deja que la ruta del archivo defina su propia política', () => {
    const res = middleware(new NextRequest('http://localhost/api/admin/leads/abc/comprobante/archivo'));

    expect(res.headers.get('content-security-policy')).toBeNull();
  });

  it('el resto del sitio sigue sin poder ser embebido', () => {
    const res = middleware(new NextRequest('http://localhost/api/admin/leads/abc/comprobante'));

    expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
  });
});
