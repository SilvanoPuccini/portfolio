import { expect, it } from 'vitest';
import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { compatibleConfiguration, resolveCurrentOrder } from './order-config';

const web = paquetePorSlug('web-cinco-secciones')!;
const answers = Object.fromEntries(web.calificacion.map((question) => [question.id, question.opciones.find((option) => option.califica)!.valor]));

it('resolves the current package total and mandatory extras without changing historical totals', () => {
  const service = servicioPorSlug(web.servicio)!;
  const result = resolveCurrentOrder({ paquete: web.slug, extras: [service.extras[0].id], calificacion: answers });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.resumen.totalUsd).toBe(totalPedido(web, [service.extras[0].id], service.extras).totalUsd);
  expect(totalPedido(web, [], service.extras).totalUsd).toBe(web.precioUsd);
});

it('rejects unknown answers, incompatible extras, retired packages and outside-scope answers', () => {
  expect(resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: { ...answers, forged: 'yes' } })).toEqual({ ok: false, error: 'invalid_answers' });
  expect(resolveCurrentOrder({ paquete: web.slug, extras: ['forged'], calificacion: answers })).toEqual({ ok: false, error: 'invalid_extras' });
  const outside = web.calificacion[0].opciones.find((option) => !option.califica)!;
  expect(resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: { ...answers, [web.calificacion[0].id]: outside.valor } })).toEqual({ ok: false, error: 'outside_scope' });
  expect(resolveCurrentOrder({ paquete: 'tienda-a-medida', extras: [], calificacion: {} }).ok).toBe(false);
});

it('keeps only compatible answers and extras across a package change', () => {
  const landing = paquetePorSlug('landing')!;
  const service = servicioPorSlug(web.servicio)!;
  const next = compatibleConfiguration(landing, service.extras, { ...answers, obsolete: 'x' }, [service.extras[0].id, 'obsolete']);
  expect(next.calificacion).not.toHaveProperty('obsolete');
  expect(next.extras).toEqual([service.extras[0].id]);
});
