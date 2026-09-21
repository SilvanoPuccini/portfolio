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
  /** Qué se contrata, en una frase. Es la cláusula de objeto. */
  objeto?: string;
  /** Cuánto tarda la entrega. Es la obligación principal del que vende. */
  plazo?: string;
  /** Seña y saldo, o pago único. Cambia por venta, no por plantilla. */
  pago?: string;
  /** Dónde vive el cliente, para la cláusula de partes. */
  domicilio?: string;
  /** La ley que aplica, según el país del cliente. */
  jurisdiccion?: string;
  /** Cómo se llama el documento para el cliente. Sin esto sale el nombre del PDF. */
  titulo?: string;
}

/**
 * Los campos de la plantilla que sabemos llenar, por etiqueta.
 *
 * Se busca por etiqueta y no por posición porque las plantillas se editan: un
 * campo agregado en el medio correría todos los índices y el contrato saldría
 * con el precio en el lugar del nombre.
 */
/**
 * Los nueve campos que la plantilla de Documenso tiene que tener.
 *
 * Es la lista canónica: `FIELD_LABELS` acepta además algunos sinónimos
 * («monto» por «precio», «entrega» por «plazo») para no romper plantillas
 * viejas, pero lo que hay que armar es esto.
 */
export const CAMPOS_ESPERADOS = [
  'cliente', 'domicilio', 'objeto', 'alcance',
  'plazo', 'precio', 'pago', 'jurisdiccion', 'email',
] as const;

const FIELD_LABELS: Record<string, (data: ContractData) => string> = {
  cliente: (data) => data.nombre,
  nombre: (data) => data.nombre,
  email: (data) => data.email,
  precio: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  monto: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  total: (data) => `USD ${data.total.toLocaleString('es-AR')}`,
  alcance: (data) => data.alcance,
  // La cláusula II: qué se contrata. Si no viene, se cae al alcance, que dice
  // lo mismo con más detalle; una cláusula de objeto en blanco no sirve.
  objeto: (data) => data.objeto ?? data.alcance,
  // Los tres que antes quedaban escritos fijos en el PDF y no podían cambiar
  // ni por venta ni por país.
  plazo: (data) => data.plazo ?? '',
  entrega: (data) => data.plazo ?? '',
  pago: (data) => data.pago ?? '',
  domicilio: (data) => data.domicilio ?? '',
  jurisdiccion: (data) => data.jurisdiccion ?? '',
};

/**
 * Los tipos que el rellenado acepta, y cómo se llaman ahí.
 *
 * Documenso devuelve el tipo en mayúscula al leer el sobre («TEXT») y lo
 * espera en minúscula al rellenarlo («text»). Mandar el valor tal como viene
 * hace que rechace la llamada entera, no solo ese campo.
 *
 * Los que no están acá no se rellenan a propósito: una firma la pone el
 * cliente, y el mail y el nombre nativos los completa Documenso solo.
 */
const TIPOS_RELLENABLES: Record<string, string> = {
  TEXT: 'text',
  NUMBER: 'number',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DROPDOWN: 'dropdown',
  DATE: 'date',
};

export function prefillFor(fields: TemplateField[], data: ContractData) {
  return fields.flatMap((field) => {
    const label = field.fieldMeta?.label?.trim().toLowerCase();
    const value = label ? FIELD_LABELS[label]?.(data) : undefined;
    if (!value) return [];

    // Sin tipo declarado asumimos texto, que es lo que usan las plantillas.
    const tipo = field.type ? TIPOS_RELLENABLES[field.type.toUpperCase()] : 'text';
    return tipo ? [{ id: field.id, type: tipo, value }] : [];
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

  // El content-type solo se declara para JSON. Con multipart lo pone fetch,
  // que es el único que sabe la frontera que separa las partes.
  const esMultipart = init?.body instanceof FormData;

  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: token,
      ...(esMultipart ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
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
export async function createContract(
  data: ContractData,
  redirectUrl?: string,
  externalId?: string,
): Promise<ContractCreation> {
  const crudo = (process.env.DOCUMENSO_TEMPLATE_ID ?? '').trim();
  if (!crudo) throw new Error('Falta DOCUMENSO_TEMPLATE_ID');

  // Documenso reemplazó plantillas y documentos por «envelopes». Los ids
  // nuevos son `envelope_xxxx` y viven en otra ruta, con otro formato de
  // envío. Los numéricos siguen andando por la ruta vieja.
  const esSobre = !/^\d+$/.test(crudo);
  const templateId: string | number = esSobre ? crudo : Number(crudo);

  const template = await call(esSobre ? `/envelope/${crudo}` : `/template/${templateId}`) as {
    fields?: TemplateField[]; recipients?: TemplateRecipient[];
  };

  const signer = signerOf(template.recipients ?? []);
  if (!signer) throw new Error('La plantilla no tiene un firmante definido');

  const titulo = data.titulo ?? 'Contrato de prestación de servicios';

  const payload = {
    ...(esSobre ? { envelopeId: crudo } : { templateId }),
    ...(externalId ? { externalId } : {}),
    recipients: [{ id: signer.id, email: data.email, name: data.nombre }],
    prefillFields: prefillFor(template.fields ?? [], data),
    distributeDocument: true,
    override: {
      ...(redirectUrl ? { redirectUrl } : {}),
      // Sin esto el cliente recibe un correo que nombra el archivo PDF de la
      // plantilla. Eso no es un contrato: es cómo está hecho el sistema.
      title: titulo,
      subject: `Tu contrato: ${titulo}`,
      message:
        'Te dejo el contrato para firmar. Es el mismo alcance y el mismo precio que acordamos. '
        + 'Firmar no dispara ningún cobro: los datos para pagar te llegan después.',
      // Los avisos que le llegan al cliente los mandamos nosotros, con lo que
      // sigue explicado. Los de Documenso llegaban antes y en su idioma.
      emailSettings: {
        // El único que queda: es el respaldo si el cliente cierra la pestaña
        // sin firmar. Va con nuestro asunto y nuestro texto.
        recipientSigningRequest: true,
        documentPending: false,
        documentCompleted: false,
        recipientSigned: false,
        // A Silvano no le llega nada de Documenso: se entera por el panel y
        // por los avisos del sistema, que dicen qué hacer con la venta.
        ownerDocumentCreated: false,
        ownerDocumentCompleted: false,
        ownerRecipientExpired: false,
      },
    },
  };

  // `/envelope/use` no acepta JSON: espera multipart con el payload adentro.
  const cuerpo = esSobre
    ? (() => {
      const form = new FormData();
      form.append('payload', JSON.stringify(payload));
      return form;
    })()
    : JSON.stringify(payload);

  const created = await call(esSobre ? '/envelope/use' : '/template/use', {
    method: 'POST',
    body: cuerpo,
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

