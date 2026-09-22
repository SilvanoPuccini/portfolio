import { describe, expect, it } from 'vitest';

import { paquetePorSlug, servicioPorSlug } from './servicios';
import { DATOS_BASE, datosKickoff } from './kickoff';

describe('los datos que se le piden al cliente', () => {
  it('todo paquete pide al menos lo básico', () => {
    const pkg = paquetePorSlug('landing')!;
    const datos = datosKickoff(pkg, []);
    for (const base of DATOS_BASE) {
      expect(datos.map((d) => d.id)).toContain(base.id);
    }
  });

  it('cada servicio suma lo suyo', () => {
    const tienda = datosKickoff(paquetePorSlug('catalogo-cobro')!, []);
    const web = datosKickoff(paquetePorSlug('landing')!, []);

    expect(tienda.map((d) => d.id)).toContain('productos');
    expect(web.map((d) => d.id)).not.toContain('productos');
  });

  it('un extra elegido pide lo que ese extra necesita', () => {
    const servicio = servicioPorSlug('web')!;
    const conAgenda = datosKickoff(paquetePorSlug('web-cinco-secciones')!, ['agenda'], servicio.extras);
    const sinAgenda = datosKickoff(paquetePorSlug('web-cinco-secciones')!, [], servicio.extras);

    expect(conAgenda.map((d) => d.id)).toContain('horarios');
    expect(sinAgenda.map((d) => d.id)).not.toContain('horarios');
  });

  it('no repite un dato aunque lo pidan el servicio y un extra', () => {
    const servicio = servicioPorSlug('web')!;
    const datos = datosKickoff(paquetePorSlug('web-cinco-secciones')!, ['agenda', 'pago'], servicio.extras);
    const ids = datos.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nunca pide una contraseña', () => {
    // Las claves no se piden por formulario: se pide acceso como colaborador.
    // Un formulario con contraseñas es una filtración esperando una fecha.
    for (const servicio of ['web', 'tienda', 'automatizacion', 'auditoria', 'cuidado']) {
      const paquete = servicioPorSlug(servicio)!.paquetes[0];
      if (!paquete) continue;

      for (const dato of datosKickoff(paquete, [])) {
        expect(dato.label.es.toLowerCase()).not.toMatch(/contraseña|clave|password/);

        // Nombrarlas está bien, pero solo para decir que no se mandan.
        const ayuda = dato.ayuda.es.toLowerCase();
        if (/contraseña|clave/.test(ayuda)) {
          expect(ayuda).toMatch(/nunca me mandes|no me mandes|sin contraseñas|no hace falta/);
        }
      }
    }
  });

  it('está escrito en los dos idiomas', () => {
    for (const dato of datosKickoff(paquetePorSlug('catalogo-cobro')!, [])) {
      expect(dato.label.en.trim().length).toBeGreaterThan(0);
      expect(dato.ayuda.en.trim().length).toBeGreaterThan(0);
    }
  });

  it('lo obligatorio es lo que sin eso no se arranca', () => {
    const datos = datosKickoff(paquetePorSlug('landing')!, []);
    const obligatorios = datos.filter((d) => d.obligatorio).map((d) => d.id);

    expect(obligatorios).toContain('negocio');
    // El logo no frena el arranque: si no tiene, se resuelve.
    expect(obligatorios).not.toContain('logo');
  });
});
