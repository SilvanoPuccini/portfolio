import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { paquetePorSlug, servicioPorSlug, totalPedido } from '@/content/servicios';
import { buildContract, Packer, type ContractData } from '@/lib/contract-template';
import { contractReadyHtml } from '@/lib/email-templates/contract-ready';
import { paymentRequestHtml } from '@/lib/email-templates/payment-request';
import { proposalReadyHtml } from '@/lib/email-templates/proposal-ready';
import { questionnaireInviteHtml } from '@/lib/email-templates/questionnaire-invite';
import { legalClauseFor } from '@/lib/leads/legal-clause';

/**
 * Vista previa de la venta, sin tocar Documenso ni la base.
 *
 * Genera el contrato y los cuatro correos con datos de ejemplo, para poder
 * LEERLOS antes de cargar nada en ningún servicio. Es también el test que
 * protege el contrato: si una cláusula o un monto dejan de salir, falla acá.
 *
 * Los archivos salen en `vista-previa-venta/`, dentro de Descargas si existe.
 */

const DESTINO = (() => {
  for (const base of ['/mnt/d/Descargas', '/mnt/c/Users/Public/Downloads']) {
    try {
      const dir = join(base, 'vista-previa-venta');
      mkdirSync(dir, { recursive: true });
      return dir;
    } catch {
      continue;
    }
  }
  const dir = join(process.cwd(), 'vista-previa-venta');
  mkdirSync(dir, { recursive: true });
  return dir;
})();

/** La compra directa: paquete del catálogo más los extras que tildó. */
function ventaDirecta(): ContractData {
  const paquete = paquetePorSlug('web-cinco-secciones')!;
  const servicio = servicioPorSlug('web')!;
  const pedido = totalPedido(paquete, ['agenda', 'logo'], servicio.extras);

  return {
    clientName: 'Estefanía Ortigosa',
    clientLocation: 'Córdoba',
    clientCountry: 'Argentina',
    projectDescription: `${paquete.nombre.es}. ${paquete.resumen.es}`,
    deliverables: [
      ...paquete.incluye.es,
      ...pedido.extras.map((extra) => extra.label.es),
    ].join('\n'),
    totalHours: paquete.horas,
    totalPrice: pedido.totalUsd ?? 0,
    hourlyRate: 30,
    paymentTerms: 'Pago único por adelantado, antes de empezar.',
    estimatedWeeks: Math.ceil(paquete.plazoDias / 5),
    legalClause: legalClauseFor('Argentina'),
  };
}

/** La venta con llamada: alcance acordado y seña. */
function ventaConLlamada(): ContractData {
  return {
    clientName: 'Marcelo Fuentes',
    clientLocation: 'Santiago',
    clientCountry: 'Chile',
    projectDescription:
      'Sistema de gestión a medida, primera etapa: carga de pedidos y estado de cada uno.',
    deliverables: [
      'Panel de pedidos con estados',
      'Usuarios con permisos por rol',
      'Aviso por mail en cada cambio de estado',
      'Capacitación de una hora al equipo',
    ].join('\n'),
    totalHours: 60,
    totalPrice: 1800,
    hourlyRate: 30,
    paymentTerms: 'Seña del 50% para empezar, el resto contra entrega.',
    estimatedWeeks: 6,
    legalClause: legalClauseFor('Chile'),
  };
}

async function guardarContrato(nombre: string, data: ContractData) {
  const buffer = await Packer.toBuffer(buildContract(data));
  writeFileSync(join(DESTINO, `${nombre}.docx`), buffer);
  return buffer;
}

describe('vista previa de la venta', () => {
  it('el contrato de una compra directa lleva el total con extras y la ley argentina', async () => {
    const data = ventaDirecta();

    // 790 del paquete + 150 de la agenda + 80 del logo.
    expect(data.totalPrice).toBe(1020);
    expect(data.legalClause).toMatch(/Argentin/i);
    expect(data.deliverables).toContain('Agenda de turnos');

    const buffer = await guardarContrato('contrato-compra-directa', data);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('el contrato de una venta con llamada lleva la seña y la ley chilena', async () => {
    const data = ventaConLlamada();

    expect(data.paymentTerms).toMatch(/50%/);
    expect(data.legalClause).toMatch(/Chile/i);

    const buffer = await guardarContrato('contrato-con-llamada', data);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('el molde para Documenso sale del mismo texto, con los huecos en su lugar', async () => {
    const data: ContractData = { ...ventaDirecta(), plantilla: true };
    const buffer = await guardarContrato('PLANTILLA-para-documenso', data);

    // El molde no puede llevar los datos de nadie: si quedara un nombre
    // adentro, todos los contratos saldrían con ese nombre.
    const texto = buffer.toString('latin1');
    expect(texto).not.toContain('Ortigosa');
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it('los cuatro correos del circuito se pueden leer antes de mandarlos', () => {
    const lead = { name: 'Estefanía Ortigosa', email: 'estefania@ejemplo.com' };

    const correos: Record<string, string> = {
      '1-cuestionario': questionnaireInviteHtml(lead, 'https://silvanopuccini.dev/cliente/TOKEN'),
      '2-propuesta': proposalReadyHtml({ ...lead, responseUrl: 'https://silvanopuccini.dev/cliente/TOKEN' }),
      '3-contrato': contractReadyHtml(lead),
      '4-pago': paymentRequestHtml({
        name: lead.name,
        amount: 1020,
        total: 1020,
        pct: 100,
        singlePayment: true,
        paymentInstructions: 'Alias: silvano.mp · CBU: 0000003100000000000000',
        localQuote: {
          currency: 'ARS',
          amount: 1_530_000,
          rate: 1500,
          source: 'Dólar MEP',
          updatedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 72 * 3_600_000).toISOString(),
        },
      }),
    };

    for (const [nombre, html] of Object.entries(correos)) {
      expect(html).toContain('Estefanía');
      writeFileSync(join(DESTINO, `mail-${nombre}.html`), html);
    }
  });

  it('deja anotado qué campos espera la plantilla de Documenso', () => {
    const data = ventaDirecta();

    const guia = [
      'PLANTILLA DE DOCUMENSO — los campos que el sistema rellena solo',
      '',
      'Cada campo de texto de la plantilla tiene que llamarse exactamente así',
      '(en Documenso: el campo, y en el panel de la derecha, Label). El nombre',
      'es lo que el sistema busca; dónde esté en la hoja no importa.',
      '',
      '  cliente    -> el nombre de quien firma',
      '  email      -> su correo',
      '  precio     -> el total en dólares, ya con los extras',
      '  alcance    -> la lista de lo que incluye',
      '',
      'Con la venta de esta carpeta quedaría así:',
      '',
      `  cliente  = ${data.clientName}`,
      '  email    = estefania@ejemplo.com',
      `  precio   = USD ${data.totalPrice.toLocaleString('es-AR')}`,
      `  alcance  = ${data.deliverables.split('\n').join(', ')}`,
      '',
      'Lo que HOY no viaja, y por ahora conviene dejar escrito fijo en el PDF:',
      '  - el plazo de entrega',
      '  - la forma de pago (seña o pago único)',
      '  - la jurisdicción',
      '',
      'Cuando la plantilla esté cargada, su id va en Vercel como',
      'DOCUMENSO_TEMPLATE_ID.',
    ].join('\n');

    writeFileSync(join(DESTINO, 'COMO-ARMAR-LA-PLANTILLA.txt'), guia);
    expect(guia).toContain('DOCUMENSO_TEMPLATE_ID');
  });
});
