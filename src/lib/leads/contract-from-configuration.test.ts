import { describe, expect, it } from 'vitest';
import { revisionFromConfiguration } from './contract-from-configuration';

const archived = {
  schemaVersion: 1 as const,
  catalogVersion: 'catalog-v1', policyVersion: 'policy-v1',
  createdAt: '2026-01-01T00:00:00.000Z', locale: 'es' as const,
  package: { id: 'old-package', label: 'Frozen package', description: 'Frozen project',
    oneTimeUsd: 800, recurringUsd: 0, included: ['Frozen deliverable'], excluded: ['Frozen exclusion'], deliveryDays: 20 },
  extras: [{ id: 'old-extra', label: 'Frozen extra', description: 'Frozen extra detail', amountUsd: 100, cadence: 'once' as const }],
  answers: [], charges: { oneTimeUsd: 900, recurringUsd: 0 }, responsibilities: ['Frozen responsibility'],
};

describe('revisionFromConfiguration', () => {
  it('projects only archived scope, charge, responsibilities and delivery window', () => {
    const revision = revisionFromConfiguration(archived, { nombre: 'Buyer', localidad: null, pais: 'Argentina' }, 'Argentina', 3);
    expect(revision.datos).toMatchObject({
      projectDescription: 'Frozen project', deliverables: 'Frozen deliverable\nFrozen extra',
      excluded: 'Frozen exclusion', totalPrice: 900, plazoDiasHabiles: 20,
      diasDeEspera: 3, servicePolicy: ['Frozen responsibility'],
    });
    expect(revision.texto).toContain('Frozen deliverable');
    expect(revision.texto).not.toContain('old-package');
  });
});
