import { describe, expect, it } from 'vitest';
import { PACKAGES, activePackages, packageForTemplate, type FixedPackage } from './packages';

const live: FixedPackage = {
  ...PACKAGES[0],
  slug: 'prueba',
  active: true,
  documensoTemplateId: 42,
  directLink: 'https://app.documenso.com/d/abc123',
};

describe('catálogo de paquetes', () => {
  it('el modelo arranca apagado: no se publica un precio sin definir', () => {
    expect(PACKAGES.length).toBeGreaterThan(0);
    expect(activePackages()).toEqual([]);
  });

  it('cada paquete tiene precio, plazo y contenido en los dos idiomas', () => {
    for (const pkg of PACKAGES) {
      expect(pkg.priceUsd).toBeGreaterThan(0);
      expect(pkg.deliveryDays).toBeGreaterThan(0);
      expect(pkg.includes.es.length).toBe(pkg.includes.en.length);
      expect(pkg.name.es && pkg.name.en).toBeTruthy();
    }
  });

  it('solo se muestra un paquete activo y con link', () => {
    expect(activePackages([live])).toEqual([live]);
    expect(activePackages([{ ...live, directLink: null }])).toEqual([]);
    expect(activePackages([{ ...live, active: false }])).toEqual([]);
  });

  it('encuentra el paquete por la plantilla de Documenso', () => {
    expect(packageForTemplate(42, [live])).toBe(live);
    expect(packageForTemplate('42', [live])).toBe(live);
  });

  it('una plantilla desconocida o un paquete apagado no crean ventas', () => {
    expect(packageForTemplate(7, [live])).toBeNull();
    expect(packageForTemplate(null, [live])).toBeNull();
    expect(packageForTemplate(42, [{ ...live, active: false }])).toBeNull();
  });
});
