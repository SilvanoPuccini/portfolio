import type { Extra, Localized, Paquete } from './servicios';
import { servicioPorSlug } from './servicios';

/**
 * Lo que se le pide al cliente para poder arrancar.
 *
 * No es una lista por servicio: es un árbol que se abre según el paquete que
 * compró y los extras que tildó. Una landing tiene una sección y pregunta por
 * una; la web de cinco pregunta cinco veces lo mismo. Vender cincuenta
 * productos no se parece en nada a vender uno.
 *
 * Pedirle todo a todos es la forma más rápida de que nadie complete nada.
 *
 * Una regla que no se negocia: acá NO se piden contraseñas. Para entrar a una
 * cuenta del cliente se pide que me sume como colaborador, y si alguna vez
 * hace falta una clave va por un canal que expira. Un formulario con
 * contraseñas adentro es una filtración esperando una fecha.
 */

export type TipoDato = 'texto' | 'parrafo' | 'archivo' | 'enlace' | 'opcion';

/** Una pregunta que depende de cómo se contestó otra. */
export interface Condicion {
  id: string;
  valor: string;
}

export interface DatoKickoff {
  id: string;
  label: Localized<string>;
  ayuda: Localized<string>;
  tipo: TipoDato;
  /** Sin esto no se puede empezar. Todo lo demás se resuelve sobre la marcha. */
  obligatorio: boolean;
  /** Varios archivos, como las fotos. */
  multiple?: boolean;
  /** Para las de elegir. */
  opciones?: Localized<string[]>;
  visibleSi?: Condicion;
  /**
   * La opción que el sistema propone, a partir de lo que el cliente ya
   * contestó cuando compró. Es una sugerencia marcada, no una imposición:
   * puede cambiarla.
   */
  sugerido?: string;
}

/**
 * Un bloque que se repite: las secciones de la web, los productos del catálogo.
 *
 * `veces` lo fija el paquete cuando se sabe de antemano (una landing tiene una
 * sección, la web de cinco tiene cinco). Cuando no se sabe, lo decide el
 * cliente agregando filas.
 */
export interface GrupoKickoff {
  id: string;
  label: Localized<string>;
  ayuda: Localized<string>;
  veces?: number;
  campos: DatoKickoff[];
  visibleSi?: Condicion;
}

export interface PlanKickoff {
  datos: DatoKickoff[];
  grupos: GrupoKickoff[];
  /** Lo que ya contestó al comprar. No se le vuelve a preguntar. */
  yaSabemos: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/*  Lo que hace falta siempre                                                  */
/* -------------------------------------------------------------------------- */

export const DATOS_BASE: DatoKickoff[] = [
  {
    id: 'negocio',
    label: { es: '¿Cómo se llama tu negocio?', en: 'What is your business called?' },
    ayuda: {
      es: 'El nombre tal como querés que aparezca en el sitio.',
      en: 'The name exactly as you want it to appear on the site.',
    },
    tipo: 'texto',
    obligatorio: true,
  },
  {
    id: 'que_hacen',
    label: { es: '¿Qué hacen y a quién le venden?', en: 'What do you do and who do you sell to?' },
    ayuda: {
      es: 'Contámelo como se lo contarías a alguien en un ascensor. De acá salen los textos.',
      en: 'Tell me like you would to someone in an elevator. The copy comes from this.',
    },
    tipo: 'parrafo',
    obligatorio: true,
  },
  {
    id: 'whatsapp',
    label: { es: 'El WhatsApp donde querés recibir las consultas', en: 'The WhatsApp where you want enquiries' },
    ayuda: {
      es: 'Con el código de país. Es el número al que va a llevar el botón del sitio.',
      en: 'With the country code. This is where the site button will lead.',
    },
    tipo: 'texto',
    obligatorio: true,
  },
  {
    id: 'logo',
    label: { es: 'Tu logo', en: 'Your logo' },
    ayuda: {
      es: 'En la mejor calidad que tengas. Si no tenés, seguimos igual y lo vemos después.',
      en: 'In the best quality you have. If you do not have one, we carry on and sort it later.',
    },
    tipo: 'archivo',
    obligatorio: false,
  },
  {
    id: 'fotos',
    label: { es: 'Fotos tuyas, del local o del trabajo', en: 'Photos of you, your place or your work' },
    ayuda: {
      es: 'Las propias rinden mucho más que las de banco, aunque sean del celular. Si no tenés, uso de banco.',
      en: 'Your own beat stock photos by far, even from a phone. If you have none, I use stock.',
    },
    tipo: 'archivo',
    obligatorio: false,
    multiple: true,
  },
  {
    id: 'redes',
    label: { es: 'Tus redes', en: 'Your social profiles' },
    ayuda: {
      es: 'Instagram, Facebook, LinkedIn, lo que uses. Un link por línea.',
      en: 'Instagram, Facebook, LinkedIn, whatever you use. One link per line.',
    },
    tipo: 'enlace',
    obligatorio: false,
  },
  {
    id: 'dominio',
    label: { es: '¿Ya tenés un dominio?', en: 'Do you already have a domain?' },
    ayuda: {
      es: 'Si lo tenés, poné cuál y dónde lo compraste. Si no, te digo cuál conviene y queda a tu nombre.',
      en: 'If you have one, tell me which and where you bought it. If not, I will suggest one and it stays in your name.',
    },
    tipo: 'texto',
    obligatorio: false,
  },
  {
    id: 'referencias',
    label: { es: 'Sitios que te gusten', en: 'Sites you like' },
    ayuda: {
      es: 'Dos o tres, aunque sean de otro rubro. Decime qué te gusta de cada uno.',
      en: 'Two or three, even from another industry. Tell me what you like about each.',
    },
    tipo: 'parrafo',
    obligatorio: false,
  },
];

/* -------------------------------------------------------------------------- */
/*  Bloques que se repiten                                                     */
/* -------------------------------------------------------------------------- */

/** Una sección de la web: lo que dice y lo que se ve. Igual para todas. */
function secciones(veces: number): GrupoKickoff {
  return {
    id: 'secciones',
    label: { es: 'Las secciones de tu sitio', en: 'Your site sections' },
    ayuda: {
      es: veces === 1
        ? 'Tu página tiene una sola sección. Contame qué va a decir.'
        : `Tu sitio tiene ${veces} secciones. Completá lo que puedas: lo que falte lo escribo yo.`,
      en: veces === 1
        ? 'Your page has a single section. Tell me what it will say.'
        : `Your site has ${veces} sections. Fill in what you can: I write whatever is missing.`,
    },
    veces,
    campos: [
      {
        id: 'titulo',
        label: { es: 'Título de la sección', en: 'Section title' },
        ayuda: { es: 'Por ejemplo: Quiénes somos, Servicios, Contacto.', en: 'For example: About, Services, Contact.' },
        tipo: 'texto',
        obligatorio: false,
      },
      {
        id: 'texto',
        label: { es: '¿Qué querés que diga?', en: 'What should it say?' },
        ayuda: {
          es: 'En tus palabras, sin preocuparte por cómo suena. Yo lo redacto después.',
          en: 'In your own words, no need to polish it. I will write it properly afterwards.',
        },
        tipo: 'parrafo',
        obligatorio: false,
      },
      {
        id: 'imagen',
        label: { es: 'La imagen de esa sección', en: 'The image for that section' },
        ayuda: { es: 'Si tenés una propia. Si no, elijo una acorde.', en: 'If you have one. If not, I pick a fitting one.' },
        tipo: 'archivo',
        obligatorio: false,
      },
    ],
  };
}

/** Los primeros artículos del blog, que vienen incluidos en el paquete. */
const ARTICULOS: GrupoKickoff = {
  id: 'articulos',
  label: { es: 'Los primeros artículos', en: 'The first articles' },
  ayuda: {
    es: 'Tu paquete incluye tres escritos. Decime de qué querés que hablen y los escribo yo.',
    en: 'Your package includes three written for you. Tell me what they should cover and I write them.',
  },
  veces: 3,
  campos: [
    {
      id: 'tema',
      label: { es: '¿De qué va a hablar?', en: 'What is it about?' },
      ayuda: {
        es: 'Una pregunta que te hagan seguido tus clientes suele ser el mejor artículo.',
        en: 'A question your clients ask often usually makes the best article.',
      },
      tipo: 'texto',
      obligatorio: false,
    },
  ],
};

/** El catálogo cargado uno por uno, cuando el cliente no tiene una planilla. */
const PRODUCTOS: GrupoKickoff = {
  id: 'productos',
  label: { es: 'Tus productos', en: 'Your products' },
  ayuda: {
    es: 'Agregá uno por uno. Podés dejarlo a medias y seguir más tarde: se guarda.',
    en: 'Add them one by one. You can stop halfway and continue later: it is saved.',
  },
  visibleSi: { id: 'modo_catalogo', valor: 'uno_por_uno' },
  campos: [
    {
      id: 'nombre',
      label: { es: 'Nombre', en: 'Name' },
      ayuda: { es: 'Como lo busca tu cliente.', en: 'As your customer would search for it.' },
      tipo: 'texto',
      obligatorio: true,
    },
    {
      id: 'precio',
      label: { es: 'Precio', en: 'Price' },
      ayuda: { es: 'Si varía, poné el más común y lo ajustamos.', en: 'If it varies, use the most common one and we adjust.' },
      tipo: 'texto',
      obligatorio: true,
    },
    {
      id: 'descripcion',
      label: { es: 'Descripción', en: 'Description' },
      ayuda: { es: 'Dos líneas alcanzan. Lo que le importa a quien lo compra.', en: 'Two lines is enough. What matters to the buyer.' },
      tipo: 'parrafo',
      obligatorio: false,
    },
    {
      id: 'categoria',
      label: { es: 'Categoría', en: 'Category' },
      ayuda: { es: 'Para agrupar en el catálogo. Si son pocos, dejalo vacío.', en: 'To group them in the catalog. If there are few, leave it empty.' },
      tipo: 'texto',
      obligatorio: false,
    },
    {
      id: 'foto',
      label: { es: 'La foto del producto', en: 'The product photo' },
      ayuda: { es: 'Una por producto. Con fondo claro se ve mejor.', en: 'One per product. A light background works best.' },
      tipo: 'archivo',
      obligatorio: false,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  Qué pide cada paquete                                                      */
/* -------------------------------------------------------------------------- */

const COBRO: DatoKickoff = {
  id: 'cobro',
  label: { es: 'Tu cuenta para cobrar', en: 'Your account to get paid' },
  ayuda: {
    es: 'El alias o CBU que querés mostrar, y el mail de tu cuenta de Mercado Pago si la tenés. '
      + 'Para conectarla me sumás como usuario desde tu panel: nunca me mandes una clave acá.',
    en: 'The bank alias you want shown, and your Mercado Pago account email if you have one. '
      + 'You add me as a user from your own panel: never send a key here.',
  },
  tipo: 'parrafo',
  obligatorio: true,
};

const MODO_CATALOGO: DatoKickoff = {
  id: 'modo_catalogo',
  label: { es: '¿Cómo preferís pasarme los productos?', en: 'How would you rather send me the products?' },
  ayuda: {
    es: 'Si ya tenés una planilla, mandala y yo la cargo. Si no, cargalos acá uno por uno y los vas viendo.',
    en: 'If you already have a spreadsheet, send it and I load it. If not, add them here one by one.',
  },
  tipo: 'opcion',
  obligatorio: true,
  opciones: {
    es: ['Te mando un archivo', 'Los cargo uno por uno'],
    en: ['I send you a file', 'I add them one by one'],
  },
};

const PRODUCTOS_ARCHIVO: DatoKickoff = {
  id: 'productos_archivo',
  label: { es: 'Tu planilla de productos', en: 'Your product spreadsheet' },
  ayuda: {
    es: 'Con nombre, precio y descripción. Excel, Sheets, Word o lo que tengas: yo lo ordeno. '
      + 'Las fotos van abajo, todas juntas.',
    en: 'With name, price and description. Excel, Sheets, Word, whatever you have: I sort it out. '
      + 'Photos go below, all together.',
  },
  tipo: 'archivo',
  obligatorio: true,
  visibleSi: { id: 'modo_catalogo', valor: 'archivo' },
};

const FOTOS_PRODUCTOS: DatoKickoff = {
  id: 'fotos_productos',
  label: { es: 'Las fotos de los productos', en: 'The product photos' },
  ayuda: {
    es: 'Todas juntas. Poneles de nombre el del producto y las emparejo sin preguntarte.',
    en: 'All together. Name each file after its product and I match them without asking.',
  },
  tipo: 'archivo',
  obligatorio: false,
  multiple: true,
  visibleSi: { id: 'modo_catalogo', valor: 'archivo' },
};

/** Lo propio de cada servicio, que no depende del paquete. */
const POR_SERVICIO: Record<string, DatoKickoff[]> = {
  automatizacion: [
    {
      id: 'proceso',
      label: { es: 'El proceso, paso por paso', en: 'The process, step by step' },
      ayuda: {
        es: 'Como se lo explicarías a alguien que empieza mañana. Si tenés capturas, mejor.',
        en: 'As you would explain it to someone starting tomorrow. Screenshots help.',
      },
      tipo: 'parrafo',
      obligatorio: true,
    },
    {
      id: 'accesos',
      label: { es: '¿A qué sistemas hay que conectarse?', en: 'Which systems does it connect to?' },
      ayuda: {
        es: 'Decime cuáles son y sumame como colaborador desde cada uno. Nunca me mandes una clave acá.',
        en: 'Tell me which ones and add me as a collaborator from each. Never send a key here.',
      },
      tipo: 'parrafo',
      obligatorio: true,
    },
  ],
  auditoria: [
    {
      id: 'direccion',
      label: { es: 'La dirección del sitio a revisar', en: 'The address of the site to review' },
      ayuda: { es: 'Si todavía no es público, contame dónde está.', en: 'If it is not public yet, tell me where it lives.' },
      tipo: 'enlace',
      obligatorio: true,
    },
  ],
  cuidado: [
    {
      id: 'hosting',
      label: { es: '¿Dónde está alojado el sitio?', en: 'Where is the site hosted?' },
      ayuda: {
        es: 'Si no sabés, decime quién te lo hizo. Para entrar me sumás como colaborador, no hace falta que me pases claves.',
        en: 'If you do not know, tell me who built it. Add me as a collaborator; no passwords needed.',
      },
      tipo: 'parrafo',
      obligatorio: true,
    },
  ],
};

/** Lo que abre cada paquete en particular: acá vive la cascada. */
const POR_PAQUETE: Record<string, { datos?: DatoKickoff[]; grupos?: GrupoKickoff[] }> = {
  landing: { grupos: [secciones(1)] },
  'web-cinco-secciones': { grupos: [secciones(5)] },
  'web-con-blog': { grupos: [secciones(5), ARTICULOS] },
  'catalogo-whatsapp': {
    datos: [MODO_CATALOGO, PRODUCTOS_ARCHIVO, FOTOS_PRODUCTOS],
    grupos: [PRODUCTOS],
  },
  'catalogo-cobro': {
    datos: [MODO_CATALOGO, PRODUCTOS_ARCHIVO, FOTOS_PRODUCTOS, COBRO],
    grupos: [PRODUCTOS],
  },
};

/** Lo que agrega cada extra que el cliente haya tildado. */
const POR_EXTRA: Record<string, DatoKickoff[]> = {
  agenda: [
    {
      id: 'horarios',
      label: { es: 'Tus horarios de atención', en: 'Your opening hours' },
      ayuda: {
        es: 'Qué días, de qué hora a qué hora, y cuánto dura cada turno.',
        en: 'Which days, from when to when, and how long each slot lasts.',
      },
      tipo: 'parrafo',
      obligatorio: true,
    },
  ],
  pago: [COBRO],
  idioma: [
    {
      id: 'segundo_idioma',
      label: { es: '¿En qué segundo idioma?', en: 'Which second language?' },
      ayuda: { es: 'Inglés o portugués.', en: 'English or Portuguese.' },
      tipo: 'texto',
      obligatorio: true,
    },
  ],
  video: [
    {
      id: 'video_guion',
      label: { es: '¿Qué querés que diga el video?', en: 'What should the video say?' },
      ayuda: {
        es: 'Tres o cuatro frases. Si tenés material propio para usar, subilo.',
        en: 'Three or four lines. If you have your own footage, upload it.',
      },
      tipo: 'parrafo',
      obligatorio: false,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  El plan de este cliente                                                    */
/* -------------------------------------------------------------------------- */

function sinRepetir<T extends { id: string }>(lista: T[]): T[] {
  const vistos = new Set<string>();
  return lista.filter((item) => (vistos.has(item.id) ? false : (vistos.add(item.id), true)));
}

/**
 * Todo lo que hay que pedirle a este cliente, en el orden en que se pregunta.
 *
 * Primero lo básico, que cualquiera contesta de memoria; después lo del
 * paquete, que puede requerir ir a buscar algo. Empezar por lo difícil es
 * empezar por el abandono.
 */
/**
 * Lo que el cliente contestó al comprar, traducido a una sugerencia.
 *
 * Es la costura entre las dos puntas del circuito: la pregunta que hizo falta
 * para venderle sirve después para no hacerle trabajo de más.
 */
function sugerencias(respuestas: Record<string, string>): Record<string, string> {
  const sugeridos: Record<string, string> = {};

  // Cuántos productos dijo que tenía decide cómo conviene cargarlos.
  if (respuestas.productos === 'hasta-cincuenta') sugeridos.modo_catalogo = 'uno_por_uno';
  if (respuestas.productos === 'hasta-trescientos') sugeridos.modo_catalogo = 'archivo';

  return sugeridos;
}

export function planKickoff(
  paquete: Paquete,
  extrasIds: string[] = [],
  extrasDisponibles: Extra[] = [],
  respuestas: Record<string, string> = {},
): PlanKickoff {
  const servicio = servicioPorSlug(paquete.servicio);
  const delPaquete = POR_PAQUETE[paquete.slug] ?? {};

  const elegidos = extrasIds.filter((id) =>
    extrasDisponibles.length === 0 || extrasDisponibles.some((extra) => extra.id === id));

  const sugeridos = sugerencias(respuestas);

  const datos = sinRepetir([
    ...DATOS_BASE,
    ...(POR_SERVICIO[servicio?.slug ?? ''] ?? []),
    ...(delPaquete.datos ?? []),
    ...elegidos.flatMap((id) => POR_EXTRA[id] ?? []),
  ]).map((dato) => (sugeridos[dato.id] ? { ...dato, sugerido: sugeridos[dato.id] } : dato));

  return {
    datos,
    grupos: sinRepetir(delPaquete.grupos ?? []),
    yaSabemos: respuestas,
  };
}

/** Solo los campos sueltos. Lo usa el panel para ver qué falta de un vistazo. */
export function datosKickoff(
  paquete: Paquete,
  extrasIds: string[] = [],
  extrasDisponibles: Extra[] = [],
  respuestas: Record<string, string> = {},
): DatoKickoff[] {
  return planKickoff(paquete, extrasIds, extrasDisponibles, respuestas).datos;
}
