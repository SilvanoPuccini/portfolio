/**
 * El contrato, creado en el momento en que el cliente acepta.
 *
 * Antes esto era: el cliente acepta → sale un correo con un .docx adjunto →
 * Silvano lo sube a Documenso a mano → manda la firma. Tres pasos manuales
 * entre el «sí» y la firma, que es justo donde una venta se enfría.
 *
 * Ahora se crea desde una plantilla de Documenso con los datos de esta venta
 * ya cargados, y devuelve el link de firma para mostrarlo ahí mismo. El
 * cliente acepta y firma en la misma sesión.
 *
 * La plantilla es la fuente del texto legal: este módulo NO escribe cláusulas.
 * Solo rellena los campos que la plantilla haya definido (precio, alcance,
 * cliente) buscándolos por su etiqueta. Si la plantilla no los tiene, el
 * contrato sale igual, sin rellenar: mejor un contrato sin el monto impreso
 * que ninguno.
 */

const API = process.env.DOCUMENSO_API_URL ?? 'https://app.documenso.com/api/v2';

export interface ContractCreation {
  envelopeId: string;
  /** La página de firma de Documenso, para abrir o embeber. */
  signingUrl: string;
  /** El token del firmante: lo necesita la firma embebida. */
  token: string;
}

interface TemplateField {
  id: number;
  type?: string;
  fieldMeta?: { label?: string } | null;
}

interface TemplateRecipient {
  id: number;
  role?: string;
  signingOrder?: number;
}

export interface ContractData {
  nombre: string;
  email: string;
  /** El total acordado, ya redondeado. */
  total: number;
  /** Una línea con lo que incluye, para la cláusula de alcance. */
  alcance: string;
  /** Cuánto tarda la entrega. Es la obligación principal del que vende. */
  plazo?: string;
  /** Seña y saldo, o pago único. Cambia por venta, no por plantilla. */
  pago?: string;
  /** Dónde vive el cliente, para la cláusula de partes. */
  domicilio?: string;
  /** La ley que aplica, según el país del cliente. */
  jurisdiccion?: string;
}

/**
 * Los campos de la plantilla que sabemos llenar, por etiqueta.
 *
 * Se busca por etiqueta y no por posición porque las plantillas se editan: un
 * campo agregado en el medio correría todos los índices y el contrato saldría
 * con el precio en el lugar del nombre.
 */
const FIELD_LABELS: Record<string, (data: ContractData) => string> = {
  cliente: (data) => data.nombre,
  nombre: (data) => data.nombre,
  email: (data) => data.email,
  precio: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  monto: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  total: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  alcance: (data) => data.alcance,
  // Los tres que antes quedaban escritos fijos en el PDF y no podían cambiar
  // ni por venta ni por país.
  plazo: (data) => data.plazo ?? '',
  entrega: (data) => data.plazo ?? '',
  pago: (data) => data.pago ?? '',
  domicilio: (data) => data.domicilio ?? '',
  jurisdiccion: (data) => data.jurisdiccion ?? '',
};

export function prefillFor(fields: TemplateField[], data: ContractData) {
  return fields.flatMap((field) => {
    const label = field.fieldMeta?.label?.trim().toLowerCase();
    const value = label ? FIELD_LABELS[label]?.(data) : undefined;
    return value ? [{ id: field.id, type: field.type ?? 'text', value }] : [];
  });
}

/** El firmante de la plantilla: el primero que firma, no el que revisa. */
export function signerOf(recipients: TemplateRecipient[]): TemplateRecipient | null {
  const signers = recipients.filter((recipient) => (recipient.role ?? 'SIGNER') === 'SIGNER');
  if (signers.length === 0) return null;
  return signers.sort((a, b) => (a.signingOrder ?? 1) - (b.signingOrder ?? 1))[0];
}

async function call(path: string, init?: RequestInit) {
  const token = process.env.DOCUMENSO_API_TOKEN;
  if (!token) throw new Error('Falta DOCUMENSO_API_TOKEN');

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: token, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Documenso ${response.status}: ${detail.slice(0, 200)}`);
  }
  return response.json();
}

/**
 * Crea el contrato de esta venta y devuelve dónde firmarlo.
 *
 * `distributeDocument` queda en true a propósito: además de mostrarlo en la
 * página, el cliente recibe el correo de Documenso. Si cierra la pestaña sin
 * firmar, el link le sigue llegando por mail.
 */
export async function createContract(data: ContractData, redirectUrl?: string): Promise<ContractCreation> {
  const templateId = Number(process.env.DOCUMENSO_TEMPLATE_ID);
  if (!Number.isFinite(templateId) || templateId <= 0) {
    throw new Error('Falta DOCUMENSO_TEMPLATE_ID');
  }

  const template = await call(`/template/${templateId}`) as {
    fields?: TemplateField[]; recipients?: TemplateRecipient[];
  };

  const signer = signerOf(template.recipients ?? []);
  if (!signer) throw new Error('La plantilla no tiene un firmante definido');

  const created = await call('/template/use', {
    method: 'POST',
    body: JSON.stringify({
      templateId,
      recipients: [{ id: signer.id, email: data.email, name: data.nombre }],
      prefillFields: prefillFor(template.fields ?? [], data),
      distributeDocument: true,
      ...(redirectUrl ? { override: { redirectUrl } } : {}),
    }),
  }) as {
    id?: string; envelopeId?: string;
    recipients?: { signingUrl?: string; token?: string }[];
  };

  const recipient = created.recipients?.[0];
  if (!recipient?.signingUrl || !recipient.token) {
    throw new Error('Documenso no devolvió el link de firma');
  }

  return {
    envelopeId: created.envelopeId ?? created.id ?? '',
    signingUrl: recipient.signingUrl,
    token: recipient.token,
  };
}
