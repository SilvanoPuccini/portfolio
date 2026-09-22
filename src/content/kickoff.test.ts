import { describe, expect, it } from 'vitest';

import { paquetePorSlug, servicioPorSlug } from './servicios';
import { DATOS_BASE, datosKickoff, planKickoff } from './kickoff';

const plan = (slug: string, extras: string[] = []) => {
  const paquete = paquetePorSlug(slug)!;
  const servicio = servicioPorSlug(paquete.servicio)!;
  return planKickoff(paquete, extras, servicio.extras);
};

describe('lo básico', () => {
  it('todo paquete pide al menos lo básico', () => {
    const ids = plan('landing').datos.map((d) => d.id);
    for (const base of DATOS_BASE) expect(ids).toContain(base.id);
  });

  it('lo obligatorio es lo que sin eso no se arranca', () => {
    const obligatorios = plan('landing').datos.filter((d) => d.obligatorio).map((d) => d.id);
    expect(obligatorios).toContain('negocio');
    expect(obligatorios).not.toContain('logo');
  });

  it('nunca pide una contraseña', () => {
    for (const servicio of ['web', 'tienda', 'automatizacion', 'auditoria', 'cuidado']) {
      const paquete = servicioPorSlug(servicio)!.paquetes[0];
      if (!paquete) continue;

      for (const dato of datosKickoff(paquete, [])) {
        expect(dato.label.es.toLowerCase()).not.toMatch(/contraseña|clave|password/);
        const ayuda = dato.ayuda.es.toLowerCase();
        if (/contraseña|clave/.test(ayuda)) {
          expect(ayuda).toMatch(/nunca me mandes|no me mandes|sin contraseñas|no hace falta/);
        }
      }
    }
  });
});

describe('la cascada: cada paquete pide lo suyo', () => {
  it('una landing pide una sola sección', () => {
    const secciones = plan('landing').grupos.find((g) => g.id === 'secciones');
    expect(secciones?.veces).toBe(1);
  });

  it('la web de cinco pide cinco', () => {
    expect(plan('web-cinco-secciones').grupos.find((g) => g.id === 'secciones')?.veces).toBe(5);
  });

  it('la web con blog además pide los primeros artículos', () => {
    const grupos = plan('web-con-blog').grupos.map((g) => g.id);
    expect(grupos).toContain('secciones');
    expect(grupos).toContain('articulos');
  });

  it('cada sección pregunta lo mismo: qué dice y qué se ve', () => {
    const campos = plan('landing').grupos[0].campos.map((c) => c.id);
    expect(campos).toContain('titulo');
    expect(campos).toContain('texto');
    expect(campos).toContain('imagen');
  });

  it('una auditoría no pide secciones ni productos: solo la dirección', () => {
    const p = plan('auditoria-web');
    expect(p.grupos).toHaveLength(0);
    expect(p.datos.map((d) => d.id)).toContain('direccion');
  });
});

describe('vender online: el cliente elige cómo cargar', () => {
  it('pregunta si manda un archivo o carga uno por uno', () => {
    const modo = plan('catalogo-cobro').datos.find((d) => d.id === 'modo_catalogo');
    expect(modo?.tipo).toBe('opcion');
    expect(modo?.opciones?.es.join(' ').toLowerCase()).toMatch(/archivo/);
  });

  it('el archivo solo se pide si eligió mandar un archivo', () => {
    const archivo = plan('catalogo-cobro').datos.find((d) => d.id === 'productos_archivo');
    expect(archivo?.visibleSi).toMatchObject({ id: 'modo_catalogo' });
  });

  it('cargar uno por uno abre la tabla de productos', () => {
    const productos = plan('catalogo-cobro').grupos.find((g) => g.id === 'productos');
    expect(productos?.visibleSi).toMatchObject({ id: 'modo_catalogo' });
    expect(productos?.campos.map((c) => c.id)).toEqual(
      expect.arrayContaining(['nombre', 'precio', 'descripcion', 'foto']),
    );
  });

  it('el catálogo sin cobro no pide la cuenta para cobrar', () => {
    const conCobro = plan('catalogo-cobro').datos.map((d) => d.id);
    const sinCobro = plan('catalogo-whatsapp').datos.map((d) => d.id);
    expect(conCobro).toContain('cobro');
    expect(sinCobro).not.toContain('cobro');
  });
});

describe('los extras también abren preguntas', () => {
  it('la agenda pide los horarios', () => {
    expect(plan('web-cinco-secciones', ['agenda']).datos.map((d) => d.id)).toContain('horarios');
    expect(plan('web-cinco-secciones', []).datos.map((d) => d.id)).not.toContain('horarios');
  });

  it('el botón de pago pide la cuenta, sin repetirla si ya estaba', () => {
    const ids = plan('web-cinco-secciones', ['pago']).datos.map((d) => d.id);
    expect(ids).toContain('cobro');
    expect(ids.filter((id) => id === 'cobro')).toHaveLength(1);
  });

  it('un extra que no es de ese servicio se ignora', () => {
    const ids = plan('landing', ['stock']).datos.map((d) => d.id);
    expect(ids).not.toContain('stock');
  });
});

describe('lo que contestó antes cambia lo que se le pregunta después', () => {
  const planCon = (slug: string, respuestas: Record<string, string>) => {
    const paquete = paquetePorSlug(slug)!;
    const servicio = servicioPorSlug(paquete.servicio)!;
    return planKickoff(paquete, [], servicio.extras, respuestas);
  };

  it('con pocos productos propone cargarlos uno por uno', () => {
    const modo = planCon('catalogo-cobro', { productos: 'hasta-cincuenta' })
      .datos.find((d) => d.id === 'modo_catalogo');
    expect(modo?.sugerido).toBe('uno_por_uno');
  });

  it('con muchos productos propone la planilla: nadie carga trescientos a mano', () => {
    const modo = planCon('catalogo-cobro', { productos: 'hasta-trescientos' })
      .datos.find((d) => d.id === 'modo_catalogo');
    expect(modo?.sugerido).toBe('archivo');
  });

  it('sin respuesta previa no propone nada y elige el cliente', () => {
    const modo = planCon('catalogo-cobro', {}).datos.find((d) => d.id === 'modo_catalogo');
    expect(modo?.sugerido).toBeUndefined();
  });

  it('lo que ya contestó no se vuelve a preguntar', () => {
    // Dijo que su sitio no tiene login cuando compró la auditoría: no tiene
    // sentido preguntárselo de nuevo con otras palabras.
    const conRespuesta = planCon('auditoria-web', { login: 'no' });
    expect(conRespuesta.yaSabemos).toMatchObject({ login: 'no' });
  });
});

describe('el plan está completo', () => {
  it('no repite ningún identificador', () => {
    for (const slug of ['landing', 'web-cinco-secciones', 'web-con-blog', 'catalogo-cobro']) {
      const p = plan(slug, ['agenda', 'pago']);
      const ids = [...p.datos.map((d) => d.id), ...p.grupos.map((g) => g.id)];
      expect(new Set(ids).size, slug).toBe(ids.length);
    }
  });

  it('está escrito en los dos idiomas, también los grupos', () => {
    const p = plan('catalogo-cobro');
    for (const dato of p.datos) {
      expect(dato.label.en.trim()).not.toBe('');
      expect(dato.ayuda.en.trim()).not.toBe('');
    }
    for (const grupo of p.grupos) {
      expect(grupo.label.en.trim()).not.toBe('');
      for (const campo of grupo.campos) expect(campo.label.en.trim()).not.toBe('');
    }
  });
});
