import { describe, expect, it } from 'vitest';

import { Packer, buildContract } from '@/lib/contract-template';
import { contratoDeVenta } from '@/content/contrato';
import { paquetePorSlug } from '@/content/servicios';
import { tipoDeDocumento } from './tipo-de-archivo';

/**
 * Qué archivo genera de verdad el contrato.
 *
 * Esto no es una prueba de layout: es la prueba de que el sistema no vuelva a
 * mentir sobre el tipo. Todo el camino declaraba «application/pdf» porque la
 * variable se llamaba `pdf`, y lo que sale de `Packer` es un .docx. El cliente
 * recibía un archivo de Word diciendo que era un PDF y no lo podía abrir.
 *
 * Si algún día el contrato pasa a ser un PDF de verdad, este test se cae y
 * avisa que hay que revisar todo el camino — que es exactamente lo que se
 * quiere que pase.
 */

const PAQUETE = paquetePorSlug('landing')!;

async function archivoDelContrato(): Promise<Buffer> {
  const contrato = contratoDeVenta({
    paquete: PAQUETE,
    extras: [],
    cliente: { nombre: 'Estefanía Ortigosa', localidad: 'Córdoba', pais: 'Argentina' },
    totalUsd: 450,
    jurisdiccion: 'Córdoba',
  });

  return Buffer.from(await Packer.toBuffer(buildContract(contrato)));
}

describe('el archivo del contrato', () => {
  it('es un .docx, no un PDF', async () => {
    const bytes = await archivoDelContrato();

    expect(tipoDeDocumento(bytes).extension).toBe('.docx');
  });

  it('no empieza con la firma de un PDF', async () => {
    // La prueba directa del bug: se servía con Content-Type application/pdf.
    const bytes = await archivoDelContrato();

    expect(bytes.subarray(0, 5).toString('latin1')).not.toBe('%PDF-');
  });

  it('empieza con la firma de un ZIP, que es lo que es un .docx', async () => {
    const bytes = await archivoDelContrato();

    expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]);
  });
});
