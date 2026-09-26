import { describe, expect, it } from 'vitest';
import { contratoDeVenta } from '@/content/contrato';
import { paquetePorSlug } from '@/content/servicios';
import { createRevision, readRevision } from './contract-revision';

const data = () => contratoDeVenta({ paquete: paquetePorSlug('landing')!, extras: [], cliente: { nombre: 'Buyer' }, totalUsd: 450, jurisdiccion: 'Original jurisdiction' });
describe('frozen contract revision', () => {
  it('keeps the exact shown clauses and data after source changes', () => {
    const source = data();
    const frozen = createRevision(source);
    source.projectDescription = 'Changed scope';
    source.totalPrice = 9999;
    expect(readRevision(JSON.parse(JSON.stringify(frozen)))).toEqual(frozen);
    expect(frozen.datos.totalPrice).toBe(450);
    expect(frozen.texto).not.toContain('Changed scope');
    expect(frozen.revision).toMatch(/^[a-f0-9]{64}$/);
  });
  it('rejects tampered text and clauses', () => {
    const frozen = createRevision(data());
    expect(() => readRevision({ ...frozen, texto: 'different terms' })).toThrow();
    expect(() => readRevision({ ...frozen, clausulas: [] })).toThrow();
  });
});
