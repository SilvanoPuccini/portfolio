import { createHash } from 'node:crypto';
import { z } from 'zod';
import { clausulasDelContrato, type DatosDelContrato } from '@/content/contrato';

const clause = z.object({ numero: z.string(), titulo: z.string(), parrafos: z.array(z.string()),
  destacado: z.string().optional(), excluido: z.string().optional(), parrafosFinales: z.array(z.string()).optional() });
const contract = z.object({
  clientName: z.string(), clientLocation: z.string(), clientCountry: z.string(), projectDescription: z.string(),
  deliverables: z.string(), excluded: z.string().optional(), totalHours: z.number(), totalPrice: z.number(),
  hourlyRate: z.number(), paymentTerms: z.string(), estimatedWeeks: z.number(), legalClause: z.string(),
  plazoDiasHabiles: z.number().optional(), diasDeEspera: z.number().optional(),
  servicePolicy: z.array(z.string()).optional(),
  detallePrecio: z.array(z.string()).optional(), cargoMensual: z.string().optional(),
});
const schema = z.object({ datos: contract, clausulas: z.array(clause).min(1), texto: z.string(), revision: z.string().regex(/^[a-f0-9]{64}$/) });
export type ContractRevision = z.infer<typeof schema>;

function plainText(clauses: ContractRevision['clausulas']) {
  return clauses.map((item) => [ `${item.numero}. ${item.titulo}`, ...item.parrafos,
    item.destacado ?? '', item.excluido ? `No incluye:\n${item.excluido}` : '', ...(item.parrafosFinales ?? []),
  ].filter(Boolean).join('\n')).join('\n\n');
}
function hash(text: string) { return createHash('sha256').update(text, 'utf8').digest('hex'); }

export function createRevision(data: DatosDelContrato): ContractRevision {
  const datos = contract.parse(data);
  const clausulas = clausulasDelContrato(datos);
  const texto = plainText(clausulas);
  return { datos, clausulas, texto, revision: hash(texto) };
}

export function readRevision(value: unknown): ContractRevision {
  const saved = schema.parse(value);
  if (plainText(saved.clausulas) !== saved.texto || hash(saved.texto) !== saved.revision) {
    throw new Error('Invalid stored contract revision');
  }
  return saved;
}
