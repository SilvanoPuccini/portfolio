import { describe, expect, it } from 'vitest';
import { CARE_PLANS, policyForPackage, policyParagraphs } from './service-policy';
import { contratoDeVenta } from './contrato';
import { paquetePorSlug } from './servicios';
import { createRevision, readRevision } from '@/lib/leads/contract-revision';

describe('managed service policy', () => {
  it('keeps quarterly landing care separate from monthly billing', () => {
    expect(CARE_PLANS.landing).toMatchObject({ amountUsd: 40, intervalMonths: 3, requests: 1, minutes: 30 });
    expect(CARE_PLANS.landing.amountUsd * 12 / CARE_PLANS.landing.intervalMonths).toBe(160);
    expect(policyForPackage('catalogo-cobro')).toBe(CARE_PLANS.catalog);
  });
  it('bounds care and clearly separates customer costs and opt-in', () => {
    const text = policyParagraphs(CARE_PLANS.landing, 'es').join(' ');
    expect(text).toContain('USD 40 cada 3 meses');
    expect(text).toContain('30 minutos');
    expect(text).toContain('aceptación expresa');
    expect(text).toContain('dominio');
    expect(text).toContain('IA/API');
  });
  it('freezes policy with the agreement without adding a monthly landing charge', () => {
    const data = contratoDeVenta({ paquete: paquetePorSlug('landing')!, extras: [], cliente: { nombre: 'Client' }, totalUsd: 450, jurisdiccion: 'Test' });
    const revision = createRevision(data);
    expect(revision.texto).toContain('USD 40 cada 3 meses');
    expect(data.cargoMensual).toBeUndefined();
    expect(readRevision(JSON.parse(JSON.stringify(revision)))).toEqual(revision);
  });
});

it('removes retired offers from new sales without breaking historical lookup', async () => {
  const { PUBLIC_SERVICIOS, servicioPorSlug } = await import('./servicios');
  expect(paquetePorSlug('tienda-a-medida')).not.toBeNull();
  expect(servicioPorSlug('tienda')!.extras.some((extra) => extra.id === 'stock')).toBe(true);
  const current = PUBLIC_SERVICIOS.find((service) => service.slug === 'tienda')!;
  expect(current.paquetes.some((item) => item.slug === 'tienda-a-medida')).toBe(false);
  expect(current.extras.some((extra) => extra.id === 'stock')).toBe(false);
});

it('does not resurrect old monthly prices or unlimited care in a new care agreement', () => {
  const data = contratoDeVenta({ paquete: paquetePorSlug('cuidado-basico')!, extras: [], cliente: { nombre: 'Client' }, totalUsd: 0, jurisdiccion: 'Test' });
  expect(data.cargoMensual).toBeUndefined();
  expect(data.deliverables).toContain('30 minutos');
  expect(data.deliverables).not.toContain('Dos cambios');
  expect(data.paymentTerms).toContain('aceptación expresa');
});

it('discloses automation care without adding a second monthly charge', () => {
  expect(policyForPackage('una-automatizacion')).toBe(CARE_PLANS.catalog);
  expect(policyForPackage('tres-automatizaciones')).toBe(CARE_PLANS.catalog);
  const data = contratoDeVenta({ paquete: paquetePorSlug('una-automatizacion')!, extras: [{ id: 'plan-automatizacion', label: { es: 'Plan de automatización' }, precioUsd: 60, recurrente: 'mes' }], cliente: { nombre: 'Client' }, totalUsd: 450, jurisdiccion: 'Test' });
  expect(data.cargoMensual).toContain('cargo mensual de USD 60');
  expect(data.cargoMensual).toContain('aceptación expresa');
  expect(data.cargoMensual).toContain('no a dos abonos');
  expect(data.servicePolicy!.join(' ')).toContain('no consumen el cupo');
});
