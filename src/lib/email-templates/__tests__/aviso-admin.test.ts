import { describe, expect, it } from 'vitest';

import { asuntoDeAviso, avisoAdmin } from '../aviso-admin';

/**
 * Los avisos que le llegan a Silvano.
 *
 * Eran un párrafo gris igual para todo: firmar, pagar y cargar el material se
 * veían idénticos en la bandeja, y había que abrir cada uno para saber qué
 * había pasado.
 */

describe('asuntoDeAviso — se distingue sin abrirlo', () => {
  it('cada evento empieza con su marca', () => {
    expect(asuntoDeAviso('firma', 'Force Corp', 'Landing · USD 530')).toMatch(/^✍️ Firmó/);
    expect(asuntoDeAviso('material', 'Force Corp', 'listo para arrancar')).toMatch(/^📦/);
  });

  it('el pago dice en el asunto si el comprobante cuadra', () => {
    expect(asuntoDeAviso('pago', 'Force Corp', 'USD 530', 'cuadra')).toContain('✓ cuadra');
    expect(asuntoDeAviso('pago', 'Force Corp', 'USD 530', 'no-cuadra')).toContain('✕ no cuadra');
    expect(asuntoDeAviso('pago', 'Force Corp', 'USD 530', 'revisar')).toContain('revisar');
  });
});

describe('avisoAdmin', () => {
  const base = {
    tipo: 'pago' as const,
    titulo: 'Force Corp subió el comprobante',
    resumen: 'Avisó que transfirió USD 530.',
    urlFicha: 'https://silvanopuccini.dev/admin/leads/abc',
  };

  it('lleva el botón a la ficha', () => {
    expect(avisoAdmin(base)).toContain('https://silvanopuccini.dev/admin/leads/abc');
  });

  it('muestra el comprobante incrustado cuando es una imagen', () => {
    expect(avisoAdmin({ ...base, imagenCid: 'comprobante' })).toContain('src="cid:comprobante"');
  });

  it('lista lo que encontró la revisión, con el veredicto como color', () => {
    const html = avisoAdmin({
      ...base,
      veredicto: 'no-cuadra',
      hallazgos: [{ campo: 'destino', senal: 'mal', detalle: 'El destino no es ninguna cuenta tuya.' }],
    });

    expect(html).toContain('El comprobante no cuadra');
    expect(html).toContain('El destino no es ninguna cuenta tuya.');
    expect(html).toContain('#f87171');
  });

  it('escapa todo lo que viene del cliente', () => {
    const html = avisoAdmin({
      ...base,
      titulo: '<script>alert(1)</script> pagó',
      filas: [{ label: 'Cliente', valor: '<img src=x onerror=alert(1)>' }],
      hallazgos: [{ campo: 'titular', senal: 'atencion', detalle: '<b>raro</b>' }],
    });

    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>raro</b>');
  });

  it('recuerda que la revisión no aprueba nada', () => {
    expect(avisoAdmin({ ...base, veredicto: 'cuadra', hallazgos: [] })).toContain('no aprueba');
  });
});
