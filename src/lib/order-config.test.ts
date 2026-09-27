import { expect, it } from 'vitest';
import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { compatibleConfiguration, resolveCurrentOrder } from './order-config';
import { buildConfigurationSnapshot, parseConfigurationSnapshot } from './order-configuration-snapshot';

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

it('freezes only the server-resolved package, selected answers, and selected extras', () => {
  const extra = servicioPorSlug(web.servicio)!.extras[0];
  const resolved = resolveCurrentOrder({ paquete: web.slug, extras: [extra.id], calificacion: answers });
  if (!resolved.ok) throw new Error('expected a valid current configuration');
  const snapshot = buildConfigurationSnapshot(resolved, 'es', new Date('2026-09-27T12:00:00.000Z'));

  expect(snapshot).toMatchObject({
    schemaVersion: 1,
    policyVersion: '2026-09-26',
    package: { id: web.slug, label: web.nombre.es, oneTimeUsd: web.precioUsd },
    extras: [{ id: extra.id, label: extra.label.es }],
    charges: { oneTimeUsd: resolved.resumen.totalUsd, recurringUsd: resolved.resumen.recurrenteUsd },
    createdAt: '2026-09-27T12:00:00.000Z',
  });
  expect(snapshot.answers.map((answer) => answer.id)).toEqual(Object.keys(answers));
  expect(snapshot.answers.every((answer) => answer.selectedOption !== null)).toBe(true);
  expect(snapshot).not.toHaveProperty('kickoffTasks');
});

it('parses frozen labels and totals without consulting the current catalog', () => {
  const resolved = resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: answers });
  if (!resolved.ok) throw new Error('expected a valid current configuration');
  const snapshot = buildConfigurationSnapshot(resolved, 'en', new Date('2026-09-27T12:00:00.000Z'));
  const archived = { ...snapshot, package: { ...snapshot.package, id: 'retired-package', label: 'Original archived label', oneTimeUsd: 1234 } };
  expect(parseConfigurationSnapshot(archived)).toEqual(archived);
  expect(parseConfigurationSnapshot({ ...archived, charges: { ...archived.charges, oneTimeUsd: 'tampered' } })).toBeNull();
  expect(parseConfigurationSnapshot(null)).toBeNull();
});

it('refuses disabled or unknown answer branches before a snapshot can be built', () => {
  const question = web.calificacion[0];
  const disabled = question.opciones.find((option) => !option.califica)!;
  expect(resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: { ...answers, [question.id]: disabled.valor } }))
    .toMatchObject({ ok: false, error: 'outside_scope' });
  expect(resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: { ...answers, [question.id]: 'disabled-unknown-value' } }))
    .toMatchObject({ ok: false, error: 'invalid_answers' });
});

it('does not turn an unknown server charge into a zero-value frozen snapshot', () => {
  const resolved = resolveCurrentOrder({ paquete: web.slug, extras: [], calificacion: answers });
  if (!resolved.ok) throw new Error('expected a valid current configuration');
  const invalid = { ...resolved, resumen: { ...resolved.resumen, totalUsd: null } } as typeof resolved;
  expect(() => buildConfigurationSnapshot(invalid, 'es')).toThrow('finite, non-negative frozen charge amounts');
});
