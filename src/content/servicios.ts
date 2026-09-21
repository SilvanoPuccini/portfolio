/**
 * El catálogo comercial, en un solo lugar.
 *
 * De acá comen las cuatro puntas del circuito: la página pública, el banner de
 * cada paquete, el presupuesto del panel y los datos que se piden al arrancar.
 * Si un precio o un alcance cambia, cambia acá y en ningún otro archivo.
 *
 * Reglas que valen para todo el catálogo:
 *  - Un servicio tiene entre cero y tres paquetes. Sin paquetes se vende con llamada.
 *  - Todo paquete con precio cerrado declara sus horas; el test verifica que el
 *    precio siga siendo coherente con la tarifa vigente.
 *  - Toda respuesta que deja al cliente fuera del paquete dice a dónde va.
 */

export type Locale = 'es' | 'en';
export type Localized<T> = { es: T; en: T };

/** La tarifa con la que se verifican los precios cerrados. */
export const TARIFA_HORA_USD = 30;

/** Cuánto puede apartarse un precio de horas x tarifa antes de fallar el test. */
export const TOLERANCIA_PRECIO = 0.15;

/** A dónde mandamos a alguien que no entra en un paquete. */
export type Destino =
  | { tipo: 'paquete'; slug: string }
  | { tipo: 'servicio'; slug: string }
  | { tipo: 'llamada' };

export interface OpcionCalificacion {
  valor: string;
  label: Localized<string>;
  /** Si entra en el alcance del paquete. */
  califica: boolean;
  /** Obligatorio cuando no califica: nadie queda sin próximo paso. */
  hacia?: Destino;
}

export interface PreguntaCalificacion {
  id: string;
  texto: Localized<string>;
  opciones: OpcionCalificacion[];
}

export interface Extra {
  id: string;
  label: Localized<string>;
  detalle: Localized<string>;
  precioUsd: number;
  /** 'mes' para los que se cobran todos los meses y no entran en el total del proyecto. */
  recurrente?: 'mes';
  /** Los módulos de presupuesto que cubre, para pretildarlos en el panel. */
  modulos?: string[];
}

export interface Paquete {
  slug: string;
  servicio: string;
  nombre: Localized<string>;
  resumen: Localized<string>;
  /** null = se cotiza después de la llamada. */
  precioUsd: number | null;
  /** Para los que se cotizan: el piso que se publica. */
  desdeUsd?: number;
  /** 'mes' para los planes; los demás son de pago único. */
  recurrente?: 'mes';
  horas: number;
  plazoDias: number;
  destacado?: boolean;
  incluye: Localized<string[]>;
  noIncluye: Localized<string[]>;
  calificacion: PreguntaCalificacion[];
  /** Slugs de modulos_precio que este paquete cubre. */
  modulos: string[];
  pagoUnico: boolean;
  documensoTemplateId: number | null;
  directLink: string | null;
  activo: boolean;
}

export interface Derivacion {
  caso: Localized<string>;
  hacia: Destino;
  label: Localized<string>;
}

/** Una pregunta del servicio, en lenguaje de negocio. La contesta el cliente. */
export interface PreguntaServicio {
  key: string;
  label: Localized<string>;
  hint: Localized<string>;
  opciones?: Localized<string[]>;
}

export interface Servicio {
  slug: string;
  /** La frase del cliente, no la nuestra. Encabeza la tarjeta. */
  problema: Localized<string>;
  nombre: Localized<string>;
  promesa: Localized<string>;
  /** Nombre del icono de lucide. */
  icono: string;
  desdeUsd: number | null;
  modo: 'directo' | 'llamada';
  paraQuien: Localized<string[]>;
  /** Lo que hace falta saber de este servicio para cotizarlo. */
  preguntas: PreguntaServicio[];
  /** Quién no entra y a dónde lo mandamos. */
  derivaciones: Derivacion[];
  porQueNoTienePrecio?: Localized<string>;
  paquetes: Paquete[];
  extras: Extra[];
}

/* -------------------------------------------------------------------------- */
/*  1 · Web de captación                                                       */
/* -------------------------------------------------------------------------- */
/*  Las preguntas de cada servicio                                             */
/* -------------------------------------------------------------------------- */

const PREGUNTAS_WEB: PreguntaServicio[] = [
  {
    key: 'rubro',
    label: { es: '¿A qué se dedica tu negocio y a quién le vendés?', en: 'What does your business do, and who do you sell to?' },
    hint: {
      es: 'Dos líneas alcanzan. De acá salen los textos del sitio.',
      en: 'Two lines is enough. The site copy comes from this.',
    },
  },
  {
    key: 'accion',
    label: { es: '¿Qué querés que haga quien entra al sitio?', en: 'What should a visitor do on your site?' },
    hint: {
      es: 'Es la acción principal: todo el sitio se ordena alrededor de eso.',
      en: 'This is the main action: the whole site is built around it.',
    },
    opciones: {
      es: ['Que me escriba por WhatsApp', 'Que reserve un turno', 'Que compre', 'Que me conozca antes de llamarme'],
      en: ['Message me on WhatsApp', 'Book an appointment', 'Buy', 'Get to know me before calling'],
    },
  },
  {
    key: 'materiales',
    label: { es: '¿Tenés logo, textos y fotos?', en: 'Do you have a logo, copy and photos?' },
    hint: {
      es: 'Los textos los escribo yo igual. Las fotos propias siempre rinden más que las de banco.',
      en: 'I write the copy either way. Your own photos always beat stock images.',
    },
    opciones: {
      es: ['Tengo todo', 'Tengo el logo nada más', 'No tengo nada todavía'],
      en: ['I have everything', 'Just the logo', 'Nothing yet'],
    },
  },
];

const PREGUNTAS_TIENDA: PreguntaServicio[] = [
  {
    key: 'productos',
    label: {
      es: '¿Cuántos productos vas a publicar y cada cuánto cambian?',
      en: 'How many products will you list, and how often do they change?',
    },
    hint: {
      es: 'Define cómo se carga el catálogo y si hace falta un panel propio.',
      en: 'This defines how the catalog is loaded and whether you need your own panel.',
    },
  },
  {
    key: 'cobro',
    label: { es: '¿Cómo querés cobrar?', en: 'How do you want to get paid?' },
    hint: {
      es: 'El cobro por link se confirma solo; la transferencia la confirmás vos cuando ves el comprobante.',
      en: 'Link payments confirm themselves; bank transfers you confirm when you see the receipt.',
    },
    opciones: {
      es: ['Link de Mercado Pago', 'Transferencia', 'Las dos', 'Todavía no lo decidí'],
      en: ['Mercado Pago link', 'Bank transfer', 'Both', 'I have not decided yet'],
    },
  },
  {
    key: 'variantes',
    label: {
      es: '¿Manejás talles, colores o stock que se descuenta?',
      en: 'Do you handle sizes, colors or stock that gets deducted?',
    },
    hint: { es: 'Es lo que más cambia el precio de una tienda.', en: 'This is what changes a store price the most.' },
    opciones: {
      es: ['No, producto simple', 'Talles o colores', 'Stock real que se descuenta al vender'],
      en: ['No, simple products', 'Sizes or colors', 'Real stock deducted on each sale'],
    },
  },
];

const PREGUNTAS_SISTEMA: PreguntaServicio[] = [
  {
    key: 'primero',
    label: { es: '¿Qué parte de tu operación querés resolver primero?', en: 'Which part of your operation do you want solved first?' },
    hint: {
      es: 'La primera etapa se elige por lo que más te duele hoy, no por lo que sería lindo tener.',
      en: 'The first stage is chosen by what hurts most today, not by what would be nice to have.',
    },
  },
  {
    key: 'usuarios',
    label: { es: '¿Cuántas personas lo van a usar y hacen todas lo mismo?', en: 'How many people will use it, and do they all do the same thing?' },
    hint: {
      es: 'Si el encargado ve una cosa y el dueño otra, hay permisos, y los permisos son trabajo.',
      en: 'If a manager sees one thing and the owner another, that means roles, and roles are work.',
    },
  },
  {
    key: 'conexiones',
    label: { es: '¿Con qué tiene que conectarse?', en: 'What does it need to connect to?' },
    hint: {
      es: 'Facturación, el banco, una planilla que ya usás, un sistema viejo.',
      en: 'Invoicing, your bank, a spreadsheet you already use, an old system.',
    },
  },
];

const PREGUNTAS_AUTOMATIZACION: PreguntaServicio[] = [
  {
    key: 'tarea',
    label: { es: '¿Qué tarea querés que se haga sola?', en: 'Which task do you want running on its own?' },
    hint: {
      es: 'Contala como se la explicarías a alguien que empieza mañana, paso por paso.',
      en: 'Describe it as you would to someone starting tomorrow, step by step.',
    },
  },
  {
    key: 'origen',
    label: { es: '¿De dónde salen los datos hoy?', en: 'Where does the data come from today?' },
    hint: {
      es: 'Es lo que decide si entra en un paquete o hay que cotizarlo aparte.',
      en: 'This decides whether it fits a package or needs a separate quote.',
    },
    opciones: {
      es: ['De mails', 'De una planilla', 'De un formulario', 'De un sistema con API', 'De papel o fotos'],
      en: ['From emails', 'From a spreadsheet', 'From a form', 'From a system with an API', 'From paper or photos'],
    },
  },
  {
    key: 'frecuencia',
    label: { es: '¿Cuántas veces por semana pasa?', en: 'How many times a week does it happen?' },
    hint: {
      es: 'Con esto sacamos cuánto te ahorra por mes, que es contra lo que se compara el precio.',
      en: 'This gives us what it saves you per month, which is what the price is compared against.',
    },
  },
];

const PREGUNTAS_AUDITORIA: PreguntaServicio[] = [
  {
    key: 'direccion',
    label: { es: '¿Cuál es la dirección del sitio a revisar?', en: 'What is the address of the site to review?' },
    hint: { es: 'Si todavía no es público, contame dónde está.', en: 'If it is not public yet, tell me where it lives.' },
  },
  {
    key: 'preocupacion',
    label: { es: '¿Qué es lo que más te preocupa?', en: 'What worries you most?' },
    hint: { es: 'El informe arranca por ahí.', en: 'The report starts there.' },
    opciones: {
      es: ['Es lento', 'Se rompe seguido', 'No aparece en Google', 'La seguridad', 'No sé, por eso pido la revisión'],
      en: ['It is slow', 'It breaks often', 'It does not show on Google', 'Security', 'I do not know, that is why I am asking'],
    },
  },
  {
    key: 'mantiene',
    label: { es: '¿Quién lo mantiene hoy?', en: 'Who maintains it today?' },
    hint: {
      es: 'Sirve para saber si el informe se va a poder ejecutar o queda en un cajón.',
      en: 'This tells me whether the report can actually be acted on or ends up in a drawer.',
    },
  },
];

const PREGUNTAS_CUIDADO: PreguntaServicio[] = [
  {
    key: 'hosting',
    label: { es: '¿Dónde está alojado el sitio hoy?', en: 'Where is the site hosted today?' },
    hint: {
      es: 'Si no sabés, decime quién te lo hizo y lo averiguo yo.',
      en: 'If you do not know, tell me who built it and I will find out.',
    },
  },
  {
    key: 'cambios',
    label: { es: '¿Qué tipo de cambios vas a necesitar por mes?', en: 'What kind of changes will you need each month?' },
    hint: {
      es: 'Cambiar un precio o una foto es un cambio chico. Una sección nueva no.',
      en: 'Changing a price or a photo is a small change. A new section is not.',
    },
  },
];

/* -------------------------------------------------------------------------- */

const SECCIONES: PreguntaCalificacion = {
  id: 'secciones',
  texto: {
    es: '¿Cuántas secciones necesitás?',
    en: 'How many sections do you need?',
  },
  opciones: [
    { valor: 'una', label: { es: 'Una sola página', en: 'A single page' }, califica: true },
    {
      valor: 'hasta-cinco',
      label: { es: 'Entre dos y cinco', en: 'Between two and five' },
      califica: false,
      hacia: { tipo: 'paquete', slug: 'web-cinco-secciones' },
    },
    {
      valor: 'mas',
      label: { es: 'Más de cinco, o con blog', en: 'More than five, or with a blog' },
      califica: false,
      hacia: { tipo: 'paquete', slug: 'web-con-blog' },
    },
  ],
};

const web: Servicio = {
  slug: 'web',
  problema: {
    es: 'Quiero que me encuentren y me escriban',
    en: 'I want people to find me and get in touch',
  },
  nombre: { es: 'Web de captación', en: 'Lead-generating website' },
  promesa: {
    es: 'Un sitio que trabaja para vos: aparece en Google, se entiende en diez segundos y termina en una conversación por WhatsApp.',
    en: 'A site that works for you: it shows up on Google, reads clearly in ten seconds and ends in a WhatsApp conversation.',
  },
  icono: 'Globe',
  desdeUsd: 450,
  modo: 'directo',
  preguntas: PREGUNTAS_WEB,
  paraQuien: {
    es: [
      'Tenés un negocio andando y hoy vivís de Instagram o del boca en boca',
      'Te escriben, pero te escriben poco y tarde',
      'Querés algo publicado este mes, no en tres',
    ],
    en: [
      'Your business is running and today it lives on Instagram or word of mouth',
      'People do reach out, but not often and not soon enough',
      'You want it live this month, not in three',
    ],
  },
  derivaciones: [
    {
      caso: { es: 'Necesitás vender y cobrar desde el sitio', en: 'You need to sell and get paid on the site' },
      hacia: { tipo: 'servicio', slug: 'tienda' },
      label: { es: 'Vender online', en: 'Sell online' },
    },
    {
      caso: { es: 'Ya tenés un sitio y querés saber qué le falta', en: 'You already have a site and want to know what it is missing' },
      hacia: { tipo: 'servicio', slug: 'auditoria' },
      label: { es: 'Auditoría técnica', en: 'Technical audit' },
    },
  ],
  paquetes: [
    {
      slug: 'landing',
      servicio: 'web',
      nombre: { es: 'Landing', en: 'Landing page' },
      resumen: {
        es: 'Una sola página, pensada para que quien entra termine escribiéndote.',
        en: 'A single page built so whoever lands on it ends up messaging you.',
      },
      precioUsd: 450,
      horas: 15,
      plazoDias: 5,
      incluye: {
        es: [
          'Los textos los escribo yo a partir de lo que me contás',
          'Imágenes de banco elegidas para tu rubro',
          'Botón de WhatsApp y formulario de contacto',
          'SEO técnico y carga rápida en celular',
          'Video de YouTube o Instagram incrustado',
        ],
        en: [
          'I write the copy from what you tell me',
          'Stock images picked for your industry',
          'WhatsApp button and contact form',
          'Technical SEO and fast loading on mobile',
          'One embedded YouTube or Instagram video',
        ],
      },
      noIncluye: {
        es: ['Blog', 'Panel para editar los textos', 'Investigación de palabras clave'],
        en: ['Blog', 'Panel to edit the copy', 'Keyword research'],
      },
      calificacion: [SECCIONES],
      modulos: ['landing', 'seo-tecnico', 'formulario-contacto'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'web-cinco-secciones',
      servicio: 'web',
      nombre: { es: 'Web de cinco secciones', en: 'Five-section website' },
      resumen: {
        es: 'El sitio completo de un negocio: quién sos, qué hacés, cuánto sale y cómo te contactan.',
        en: 'A complete business site: who you are, what you do, what it costs and how to reach you.',
      },
      precioUsd: 790,
      horas: 26,
      plazoDias: 10,
      destacado: true,
      incluye: {
        es: [
          'Todo lo de la Landing, en cinco secciones',
          'Investigación de palabras clave de tu rubro y tu zona',
          'Sección de videos de hasta cuatro',
          'Ficha de Google con los datos que te hacen aparecer en el mapa',
        ],
        en: [
          'Everything in the Landing, across five sections',
          'Keyword research for your industry and area',
          'Video section with up to four videos',
          'Google Business profile set up so you show on the map',
        ],
      },
      noIncluye: {
        es: ['Blog', 'Tienda con cobro online'],
        en: ['Blog', 'Store with online payments'],
      },
      calificacion: [SECCIONES],
      modulos: ['sitio-institucional', 'seo-tecnico', 'seo-contenido', 'formulario-contacto'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'web-con-blog',
      servicio: 'web',
      nombre: { es: 'Web con blog', en: 'Website with blog' },
      resumen: {
        es: 'Para el negocio que quiere aparecer en Google por lo que escribe, no solo por su nombre.',
        en: 'For the business that wants to rank for what it writes, not just for its name.',
      },
      precioUsd: 1090,
      horas: 36,
      plazoDias: 15,
      incluye: {
        es: [
          'Todo lo de Web de cinco secciones',
          'Blog con categorías y buscador',
          'Los tres primeros artículos escritos',
          'Analytics con un informe mensual que te llega por mail',
        ],
        en: [
          'Everything in the five-section website',
          'Blog with categories and search',
          'The first three articles written for you',
          'Analytics with a monthly report emailed to you',
        ],
      },
      noIncluye: {
        es: ['Artículos siguientes (van en el plan de cuidado)', 'Tienda con cobro online'],
        en: ['Further articles (covered by the care plan)', 'Store with online payments'],
      },
      calificacion: [SECCIONES],
      modulos: ['sitio-institucional', 'blog', 'seo-tecnico', 'seo-contenido', 'analytics'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
  ],
  extras: [
    {
      id: 'logo',
      label: { es: 'Logo tipográfico', en: 'Typographic logo' },
      detalle: { es: 'Dos propuestas y una ronda de ajustes.', en: 'Two options and one round of changes.' },
      precioUsd: 80,
    },
    {
      id: 'agenda',
      label: { es: 'Agenda de turnos', en: 'Appointment booking' },
      detalle: {
        es: 'El cliente reserva solo y el turno cae en tu calendario.',
        en: 'Clients book themselves and the slot lands in your calendar.',
      },
      precioUsd: 150,
      modulos: ['agenda-turnos'],
    },
    {
      id: 'panel',
      label: { es: 'Panel de textos e imágenes', en: 'Text and image panel' },
      detalle: {
        es: 'Cambiás vos los textos y las fotos, sin escribirme.',
        en: 'You change the copy and photos yourself, without messaging me.',
      },
      precioUsd: 250,
      modulos: ['panel-contenido'],
    },
    {
      id: 'pago',
      label: { es: 'Botón de pago', en: 'Payment button' },
      detalle: {
        es: 'Un link de Mercado Pago para cobrar una seña o un producto.',
        en: 'A Mercado Pago link to charge a deposit or a single product.',
      },
      precioUsd: 60,
      modulos: ['pago-link'],
    },
    {
      id: 'idioma',
      label: { es: 'Segundo idioma', en: 'Second language' },
      detalle: { es: 'El sitio completo en inglés o portugués.', en: 'The whole site in English or Portuguese.' },
      precioUsd: 120,
      modulos: ['i18n'],
    },
    {
      id: 'video',
      label: { es: 'Video de presentación', en: 'Intro video' },
      detalle: {
        es: 'Treinta segundos animados con tu marca, para la portada y para redes.',
        en: 'Thirty animated seconds with your brand, for the homepage and social media.',
      },
      precioUsd: 180,
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  2 · Vender online                                                          */
/* -------------------------------------------------------------------------- */

const PRODUCTOS: PreguntaCalificacion = {
  id: 'productos',
  texto: { es: '¿Cuántos productos publicás?', en: 'How many products will you list?' },
  opciones: [
    { valor: 'hasta-cincuenta', label: { es: 'Hasta 50', en: 'Up to 50' }, califica: true },
    { valor: 'hasta-trescientos', label: { es: 'Entre 50 y 300', en: 'Between 50 and 300' }, califica: true },
    {
      valor: 'mas',
      label: { es: 'Más de 300, o con variantes y talles', en: 'More than 300, or with variants and sizes' },
      califica: false,
      hacia: { tipo: 'paquete', slug: 'tienda-a-medida' },
    },
  ],
};

const tienda: Servicio = {
  slug: 'tienda',
  problema: { es: 'Quiero vender y cobrar por internet', en: 'I want to sell and get paid online' },
  nombre: { es: 'Vender online', en: 'Sell online' },
  promesa: {
    es: 'Tu catálogo publicado y el cobro resuelto, sin comisión por venta y sin depender de una plataforma que te cambia las reglas.',
    en: 'Your catalog published and payments solved, with no per-sale commission and no platform changing the rules on you.',
  },
  icono: 'ShoppingBag',
  desdeUsd: 890,
  modo: 'directo',
  preguntas: PREGUNTAS_TIENDA,
  paraQuien: {
    es: [
      'Hoy vendés por WhatsApp y se te pierden pedidos entre las conversaciones',
      'Tu operación no entra en una plantilla: vendés por encargo, por medida o con stock que cambia',
      'Querés el control del cliente y de los datos',
    ],
    en: [
      'You sell over WhatsApp today and orders get lost between chats',
      'Your operation does not fit a template: you sell made to order, made to measure or with moving stock',
      'You want to own the customer and the data',
    ],
  },
  derivaciones: [
    {
      caso: {
        es: 'Vendés productos estándar y tu negocio entra en una plantilla de Shopify',
        en: 'You sell standard products and your business fits a Shopify template',
      },
      hacia: { tipo: 'llamada' },
      label: { es: 'Te lo digo en la llamada, sin vueltas', en: 'I will tell you straight on the call' },
    },
    {
      caso: { es: 'Solo querés mostrar el catálogo, sin cobrar', en: 'You only want to show the catalog, without charging' },
      hacia: { tipo: 'paquete', slug: 'catalogo-whatsapp' },
      label: { es: 'Catálogo con WhatsApp', en: 'Catalog with WhatsApp' },
    },
  ],
  paquetes: [
    {
      slug: 'catalogo-whatsapp',
      servicio: 'tienda',
      nombre: { es: 'Catálogo con WhatsApp', en: 'Catalog with WhatsApp' },
      resumen: {
        es: 'El catálogo ordenado y el pedido armado que te llega por WhatsApp listo para responder.',
        en: 'A tidy catalog and a ready-made order that reaches your WhatsApp ready to answer.',
      },
      precioUsd: 890,
      horas: 30,
      plazoDias: 12,
      incluye: {
        es: [
          'Catálogo con categorías, buscador y fichas de producto',
          'Carrito que arma el pedido y lo manda por WhatsApp',
          'Panel para cargar productos, precios y fotos',
          'Aviso por mail de cada pedido',
        ],
        en: [
          'Catalog with categories, search and product pages',
          'Cart that builds the order and sends it over WhatsApp',
          'Panel to load products, prices and photos',
          'Email alert for every order',
        ],
      },
      noIncluye: {
        es: ['Cobro online', 'Control de stock automático'],
        en: ['Online payments', 'Automatic stock control'],
      },
      calificacion: [PRODUCTOS],
      modulos: ['catalogo', 'panel-productos', 'carrito-whatsapp'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'catalogo-cobro',
      servicio: 'tienda',
      nombre: { es: 'Catálogo con cobro', en: 'Catalog with payments' },
      resumen: {
        es: 'Confirmás el pedido y recién ahí se cobra, por link de Mercado Pago o por transferencia.',
        en: 'You confirm the order and only then it gets charged, by Mercado Pago link or bank transfer.',
      },
      precioUsd: 1190,
      horas: 40,
      plazoDias: 15,
      destacado: true,
      incluye: {
        es: [
          'Todo lo del Catálogo con WhatsApp',
          'Cobro por link de Mercado Pago, que se confirma solo',
          'Transferencia con comprobante, que confirmás vos',
          'Estados del pedido: pendiente, pago informado, pagado',
          'Mail automático al cliente en cada cambio de estado',
        ],
        en: [
          'Everything in the WhatsApp catalog',
          'Mercado Pago link payments, confirmed automatically',
          'Bank transfer with receipt, confirmed by you',
          'Order states: pending, payment reported, paid',
          'Automatic email to the customer on every state change',
        ],
      },
      noIncluye: {
        es: ['Cálculo de envío con el correo', 'Facturación electrónica'],
        en: ['Carrier-calculated shipping', 'Electronic invoicing'],
      },
      calificacion: [PRODUCTOS],
      modulos: ['catalogo', 'panel-productos', 'carrito-whatsapp', 'pago-link', 'estados-pedido'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'tienda-a-medida',
      servicio: 'tienda',
      nombre: { es: 'Tienda a medida', en: 'Custom store' },
      resumen: {
        es: 'Cuando la operación manda: variantes, stock real, envíos, cuentas corrientes o precios por cliente.',
        en: 'When the operation rules: variants, real stock, shipping, accounts or per-customer pricing.',
      },
      precioUsd: null,
      desdeUsd: 2700,
      horas: 0,
      plazoDias: 0,
      incluye: {
        es: [
          'Alcance definido en la llamada, con una lista de lo que entra y lo que queda para después',
          'Se construye por etapas, con algo funcionando desde la primera',
        ],
        en: [
          'Scope defined on the call, with a list of what is in and what comes later',
          'Built in stages, with something working from the first one',
        ],
      },
      noIncluye: { es: [], en: [] },
      calificacion: [],
      modulos: [],
      pagoUnico: false,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
  ],
  extras: [
    {
      id: 'stock',
      label: { es: 'Control de stock', en: 'Stock control' },
      detalle: {
        es: 'Descuenta al vender y avisa cuando algo se está por terminar.',
        en: 'Deducts on sale and warns you when something is running out.',
      },
      precioUsd: 220,
      modulos: ['stock'],
    },
    {
      id: 'cupones',
      label: { es: 'Cupones de descuento', en: 'Discount codes' },
      detalle: { es: 'Códigos con vencimiento y tope de usos.', en: 'Codes with expiry and usage limits.' },
      precioUsd: 90,
    },
    {
      id: 'envios',
      label: { es: 'Zonas de envío', en: 'Shipping zones' },
      detalle: {
        es: 'Costo por zona y retiro en el local.',
        en: 'Cost per zone and pickup at your location.',
      },
      precioUsd: 140,
    },
    {
      id: 'idioma',
      label: { es: 'Segundo idioma', en: 'Second language' },
      detalle: { es: 'La tienda completa en inglés o portugués.', en: 'The whole store in English or Portuguese.' },
      precioUsd: 120,
      modulos: ['i18n'],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  3 · Sistema de gestión                                                     */
/* -------------------------------------------------------------------------- */

const sistema: Servicio = {
  slug: 'sistema',
  problema: {
    es: 'Mi operación vive en planillas y ya no da más',
    en: 'My operation lives in spreadsheets and it is at its limit',
  },
  nombre: { es: 'Sistema de gestión', en: 'Custom management system' },
  promesa: {
    es: 'El sistema que hoy tenés repartido entre Excel, WhatsApp y tu memoria, en un solo lugar y con un dueño claro de cada dato.',
    en: 'The system you keep spread across Excel, WhatsApp and your memory, in one place with a clear owner for every piece of data.',
  },
  icono: 'LayoutDashboard',
  desdeUsd: 1500,
  modo: 'llamada',
  preguntas: PREGUNTAS_SISTEMA,
  paraQuien: {
    es: [
      'Tres o más personas tocan la misma planilla y se pisan',
      'Cargás el mismo dato dos veces, en dos lugares distintos',
      'Sabés exactamente qué parte del día se te va en algo que debería ser automático',
    ],
    en: [
      'Three or more people touch the same spreadsheet and overwrite each other',
      'You enter the same data twice, in two different places',
      'You know exactly which part of your day goes into something that should be automatic',
    ],
  },
  porQueNoTienePrecio: {
    es: 'Poner un precio sin conocer tu operación sería adivinar, y adivinar termina mal para los dos. La llamada dura 45 minutos, no tiene costo, y salís de ahí con el alcance de la primera etapa y su número.',
    en: 'Quoting without knowing your operation would be guesswork, and guesswork ends badly for both of us. The call takes 45 minutes, costs nothing, and you leave it with the scope of the first stage and its number.',
  },
  derivaciones: [
    {
      caso: { es: 'Lo que necesitás es una tarea repetitiva resuelta, no un sistema', en: 'What you need is one repetitive task solved, not a system' },
      hacia: { tipo: 'servicio', slug: 'automatizacion' },
      label: { es: 'Automatización con IA', en: 'AI automation' },
    },
    {
      caso: { es: 'Ya tenés un sistema y querés saber si vale la pena arreglarlo', en: 'You already have a system and want to know if it is worth fixing' },
      hacia: { tipo: 'paquete', slug: 'auditoria-sistema' },
      label: { es: 'Auditoría de sistema', en: 'System audit' },
    },
  ],
  paquetes: [],
  extras: [],
};

/* -------------------------------------------------------------------------- */
/*  4 · Automatización con IA                                                  */
/* -------------------------------------------------------------------------- */

const ORIGEN_DATOS: PreguntaCalificacion = {
  id: 'origen',
  texto: { es: '¿De dónde salen los datos que hay que procesar?', en: 'Where does the data to process come from?' },
  opciones: [
    { valor: 'mail', label: { es: 'De mails', en: 'From emails' }, califica: true },
    { valor: 'planilla', label: { es: 'De una planilla o un formulario', en: 'From a spreadsheet or a form' }, califica: true },
    { valor: 'api', label: { es: 'De un sistema que tiene API', en: 'From a system with an API' }, califica: true },
    {
      valor: 'papel',
      label: { es: 'De papel o fotos de documentos', en: 'From paper or photos of documents' },
      califica: false,
      hacia: { tipo: 'llamada' },
    },
    {
      valor: 'sin-api',
      label: { es: 'De un sistema cerrado, sin API', en: 'From a closed system with no API' },
      califica: false,
      hacia: { tipo: 'llamada' },
    },
  ],
};

const automatizacion: Servicio = {
  slug: 'automatizacion',
  problema: {
    es: 'Hay tareas que repito todos los días a mano',
    en: 'There are tasks I repeat by hand every single day',
  },
  nombre: { es: 'Automatización con IA', en: 'AI automation' },
  promesa: {
    es: 'Esa tarea que hacés todos los días pasa a hacerse sola, con un aviso cuando algo no sale como tiene que salir.',
    en: 'That daily task starts running on its own, with an alert whenever something does not go as it should.',
  },
  icono: 'Workflow',
  desdeUsd: 390,
  modo: 'directo',
  preguntas: PREGUNTAS_AUTOMATIZACION,
  paraQuien: {
    es: [
      'Hay una tarea que sabés cuánto tiempo te come por semana',
      'Los datos ya están en un mail, una planilla o un formulario',
      'La regla es clara: si pasa esto, hacé aquello',
    ],
    en: [
      'There is a task and you know how many hours a week it eats',
      'The data already lives in an email, a spreadsheet or a form',
      'The rule is clear: if this happens, do that',
    ],
  },
  derivaciones: [
    {
      caso: { es: 'Son cinco o seis procesos conectados entre sí', en: 'It is five or six processes connected to each other' },
      hacia: { tipo: 'servicio', slug: 'sistema' },
      label: { es: 'Sistema de gestión', en: 'Management system' },
    },
  ],
  paquetes: [
    {
      slug: 'una-automatizacion',
      servicio: 'automatizacion',
      nombre: { es: 'Una automatización', en: 'One automation' },
      resumen: {
        es: 'Un proceso, de punta a punta, andando en una semana.',
        en: 'One process, end to end, running in a week.',
      },
      precioUsd: 390,
      horas: 13,
      plazoDias: 7,
      incluye: {
        es: [
          'El proceso relevado y escrito antes de programar nada',
          'La automatización andando, con su aviso de error',
          'Un tablero donde ves qué corrió y qué falló',
        ],
        en: [
          'The process mapped and written down before any code',
          'The automation running, with its error alert',
          'A dashboard showing what ran and what failed',
        ],
      },
      noIncluye: {
        es: ['El plan de monitoreo mensual, que es obligatorio y va aparte'],
        en: ['The monthly monitoring plan, which is mandatory and billed separately'],
      },
      calificacion: [ORIGEN_DATOS],
      modulos: ['automatizacion', 'panel-ejecuciones'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'tres-automatizaciones',
      servicio: 'automatizacion',
      nombre: { es: 'Tres automatizaciones', en: 'Three automations' },
      resumen: {
        es: 'Tres procesos del mismo circuito, que se pasan la posta entre ellos.',
        en: 'Three processes from the same circuit, handing off to each other.',
      },
      precioUsd: 890,
      horas: 30,
      plazoDias: 15,
      destacado: true,
      incluye: {
        es: [
          'Todo lo de Una automatización, por tres',
          'Los tres conectados: lo que sale de uno entra en el siguiente',
          'Informe mensual de lo que corrió y lo que ahorró',
        ],
        en: [
          'Everything in One automation, times three',
          'All three connected: what leaves one enters the next',
          'Monthly report of what ran and what it saved',
        ],
      },
      noIncluye: {
        es: ['El plan de monitoreo mensual, que es obligatorio y va aparte'],
        en: ['The monthly monitoring plan, which is mandatory and billed separately'],
      },
      calificacion: [ORIGEN_DATOS],
      modulos: ['automatizacion', 'panel-ejecuciones', 'integraciones'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
  ],
  extras: [
    {
      id: 'plan-automatizacion',
      label: { es: 'Plan de automatización (obligatorio)', en: 'Automation plan (mandatory)' },
      detalle: {
        es: 'USD 60 por mes: monitoreo, aviso cuando algo falla y el consumo de IA incluido. Una automatización que se rompe en silencio es peor que no tener ninguna.',
        en: 'USD 60 per month: monitoring, alerts when something breaks and AI usage included. An automation that fails silently is worse than no automation.',
      },
      precioUsd: 60,
      recurrente: 'mes',
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  5 · Auditoría técnica                                                      */
/* -------------------------------------------------------------------------- */

const auditoria: Servicio = {
  slug: 'auditoria',
  problema: {
    es: 'Tengo algo hecho y no sé si está bien',
    en: 'I have something built and I do not know if it is any good',
  },
  nombre: { es: 'Auditoría técnica', en: 'Technical audit' },
  promesa: {
    es: 'Un informe que te dice qué está mal, qué tan grave es y en qué orden conviene arreglarlo. Sirve igual si después no me contratás.',
    en: 'A report telling you what is wrong, how serious it is and in what order to fix it. It is just as useful if you never hire me.',
  },
  icono: 'ClipboardCheck',
  desdeUsd: 250,
  modo: 'directo',
  preguntas: PREGUNTAS_AUDITORIA,
  paraQuien: {
    es: [
      'Te hicieron un sitio y no sabés si te entregaron lo que pagaste',
      'Vas a invertir en algo y querés una segunda opinión antes',
      'Algo anda lento o se rompe seguido y nadie te sabe explicar por qué',
    ],
    en: [
      'Someone built you a site and you do not know if you got what you paid for',
      'You are about to invest and want a second opinion first',
      'Something is slow or breaks often and nobody can explain why',
    ],
  },
  derivaciones: [
    {
      caso: {
        es: 'Querés auditar una empresa entera, no un sitio',
        en: 'You want to audit an entire company, not a website',
      },
      hacia: { tipo: 'llamada' },
      label: { es: 'Se cotiza en una llamada', en: 'Quoted on a call' },
    },
  ],
  paquetes: [
    {
      slug: 'auditoria-web',
      servicio: 'auditoria',
      nombre: { es: 'Auditoría de sitio', en: 'Website audit' },
      resumen: {
        es: 'Tu sitio revisado en cinco días, con las prioridades ordenadas y su costo estimado.',
        en: 'Your site reviewed in five days, with priorities ordered and their estimated cost.',
      },
      precioUsd: 250,
      horas: 8,
      plazoDias: 5,
      destacado: true,
      incluye: {
        es: [
          'Velocidad, SEO técnico, accesibilidad y seguridad básica',
          'Informe escrito, ordenado por lo que más te cuesta hoy',
          'Llamada de 30 minutos para repasarlo',
          'Los USD 250 se descuentan si después hacemos el proyecto',
        ],
        en: [
          'Speed, technical SEO, accessibility and basic security',
          'Written report, ordered by what costs you most today',
          '30-minute call to walk through it',
          'The USD 250 are deducted if we do the project afterwards',
        ],
      },
      noIncluye: {
        es: ['Arreglar lo que se encuentra', 'Revisión del código de una aplicación'],
        en: ['Fixing what is found', 'Code review of an application'],
      },
      calificacion: [
        {
          id: 'paginas',
          texto: { es: '¿Cuántas páginas tiene el sitio?', en: 'How many pages does the site have?' },
          opciones: [
            { valor: 'hasta-quince', label: { es: 'Hasta 15', en: 'Up to 15' }, califica: true },
            {
              valor: 'mas',
              label: { es: 'Más de 15', en: 'More than 15' },
              califica: false,
              hacia: { tipo: 'paquete', slug: 'auditoria-sistema' },
            },
          ],
        },
        {
          id: 'login',
          texto: { es: '¿Tiene usuarios que inician sesión, o cobra online?', en: 'Does it have user logins, or take payments?' },
          opciones: [
            { valor: 'no', label: { es: 'No, es un sitio público', en: 'No, it is a public site' }, califica: true },
            {
              valor: 'si',
              label: { es: 'Sí, tiene login o cobros', en: 'Yes, it has logins or payments' },
              califica: false,
              hacia: { tipo: 'paquete', slug: 'auditoria-sistema' },
            },
          ],
        },
      ],
      modulos: ['auditoria'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'auditoria-sistema',
      servicio: 'auditoria',
      nombre: { es: 'Auditoría de sistema', en: 'System audit' },
      resumen: {
        es: 'Para aplicaciones con usuarios, paneles, tiendas o código propio. El alcance se define antes de cotizar.',
        en: 'For applications with users, dashboards, stores or your own codebase. Scope is defined before quoting.',
      },
      precioUsd: null,
      desdeUsd: 800,
      horas: 0,
      plazoDias: 0,
      incluye: {
        es: [
          'Revisión del código, la base de datos y la infraestructura',
          'Riesgos de seguridad ordenados por gravedad',
          'Informe y llamada de una hora',
        ],
        en: [
          'Review of the code, the database and the infrastructure',
          'Security risks ordered by severity',
          'Report and a one-hour call',
        ],
      },
      noIncluye: { es: ['Arreglar lo que se encuentra'], en: ['Fixing what is found'] },
      calificacion: [],
      modulos: ['auditoria-sistema'],
      pagoUnico: true,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
  ],
  extras: [],
};

/* -------------------------------------------------------------------------- */
/*  6 · Plan de cuidado                                                        */
/* -------------------------------------------------------------------------- */

const cuidado: Servicio = {
  slug: 'cuidado',
  problema: {
    es: 'Ya tengo el sitio y necesito que alguien lo mantenga',
    en: 'I already have the site and need someone to look after it',
  },
  nombre: { es: 'Plan de cuidado', en: 'Care plan' },
  promesa: {
    es: 'Alguien que responde cuando algo se rompe, hace los cambios chicos del mes y se ocupa de que el sitio siga estando.',
    en: 'Someone who answers when something breaks, makes the small monthly changes and keeps the site online.',
  },
  icono: 'ShieldCheck',
  desdeUsd: 40,
  modo: 'directo',
  preguntas: PREGUNTAS_CUIDADO,
  paraQuien: {
    es: [
      'Tu sitio ya está publicado y cambia cada tanto',
      'No querés escribirle a alguien distinto cada vez que se rompe algo',
      'Preferís un costo fijo por mes antes que una factura sorpresa',
    ],
    en: [
      'Your site is live and changes every so often',
      'You do not want to message a different person every time something breaks',
      'You prefer a fixed monthly cost over a surprise invoice',
    ],
  },
  derivaciones: [
    {
      caso: { es: 'Todavía no tenés sitio', en: 'You do not have a site yet' },
      hacia: { tipo: 'servicio', slug: 'web' },
      label: { es: 'Web de captación', en: 'Lead-generating website' },
    },
  ],
  paquetes: [
    {
      slug: 'cuidado-basico',
      servicio: 'cuidado',
      nombre: { es: 'Básico', en: 'Basic' },
      resumen: { es: 'Que el sitio siga estando y siga siendo seguro.', en: 'Keeping the site online and secure.' },
      precioUsd: 40,
      recurrente: 'mes',
      horas: 0,
      plazoDias: 0,
      incluye: {
        es: ['Dos cambios chicos por mes', 'Respuesta en 72 horas', 'Backup semanal', 'Actualizaciones de seguridad'],
        en: ['Two small changes per month', 'Response within 72 hours', 'Weekly backup', 'Security updates'],
      },
      noIncluye: { es: ['Secciones nuevas', 'Rediseños'], en: ['New sections', 'Redesigns'] },
      calificacion: [],
      modulos: [],
      pagoUnico: false,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'cuidado-completo',
      servicio: 'cuidado',
      nombre: { es: 'Completo', en: 'Complete' },
      resumen: {
        es: 'El sitio cuidado y además mejorado, mes a mes.',
        en: 'The site looked after and improved, month after month.',
      },
      precioUsd: 90,
      recurrente: 'mes',
      horas: 0,
      plazoDias: 0,
      destacado: true,
      incluye: {
        es: [
          'Cinco cambios chicos por mes',
          'Respuesta en 24 horas',
          'Backup diario',
          'Informe mensual de visitas y consultas',
        ],
        en: [
          'Five small changes per month',
          'Response within 24 hours',
          'Daily backup',
          'Monthly report of visits and enquiries',
        ],
      },
      noIncluye: { es: ['Secciones nuevas', 'Rediseños'], en: ['New sections', 'Redesigns'] },
      calificacion: [],
      modulos: [],
      pagoUnico: false,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
    {
      slug: 'cuidado-comercio',
      servicio: 'cuidado',
      nombre: { es: 'Comercio', en: 'Commerce' },
      resumen: {
        es: 'Para el que vende todos los días y no puede estar caído.',
        en: 'For the business that sells every day and cannot afford downtime.',
      },
      precioUsd: 150,
      recurrente: 'mes',
      horas: 0,
      plazoDias: 0,
      incluye: {
        es: [
          'Ocho cambios chicos por mes',
          'Respuesta el mismo día',
          'Backup diario y monitoreo de caídas',
          'Carga de productos y precios',
        ],
        en: [
          'Eight small changes per month',
          'Same-day response',
          'Daily backup and downtime monitoring',
          'Product and price loading',
        ],
      },
      noIncluye: { es: ['Secciones nuevas', 'Rediseños'], en: ['New sections', 'Redesigns'] },
      calificacion: [],
      modulos: [],
      pagoUnico: false,
      documensoTemplateId: null,
      directLink: null,
      activo: false,
    },
  ],
  extras: [],
};

export const SERVICIOS: Servicio[] = [web, tienda, sistema, automatizacion, auditoria, cuidado];

/** Los slugs viejos siguen funcionando: hay leads y links publicados con ellos. */
export const ALIAS_SERVICIOS: Record<string, string> = {
  'web-presence': 'web',
  'full-stack-builds': 'sistema',
  'automation-ai': 'automatizacion',
  'product-ux-engineering': 'auditoria',
};

/* -------------------------------------------------------------------------- */
/*  Consultas                                                                  */
/* -------------------------------------------------------------------------- */

export function paquetes(servicios: Servicio[] = SERVICIOS): Paquete[] {
  return servicios.flatMap((s) => s.paquetes);
}

export function servicioPorSlug(slug: string | null | undefined): Servicio | null {
  if (!slug) return null;
  const buscado = ALIAS_SERVICIOS[slug] ?? slug;
  return SERVICIOS.find((s) => s.slug === buscado) ?? null;
}

export function paquetePorSlug(slug: string | null | undefined): Paquete | null {
  if (!slug) return null;
  return paquetes().find((p) => p.slug === slug) ?? null;
}

/** Los que se pueden contratar sin llamada: activos y con link de firma. */
export function paquetesActivos(): Paquete[] {
  return paquetes().filter((p) => p.activo && p.directLink);
}

/** Los módulos de presupuesto que suele llevar un servicio, para pretildarlos. */
export function modulosSugeridos(servicioSlug: string | null | undefined): string[] {
  const servicio = servicioPorSlug(servicioSlug);
  if (!servicio) return [];
  const destacado = servicio.paquetes.find((p) => p.destacado) ?? servicio.paquetes[0];
  return destacado ? [...destacado.modulos] : [];
}

/** El precio declarado sigue siendo coherente con las horas y la tarifa. */
export function precioCierra(
  paquete: Pick<Paquete, 'horas' | 'precioUsd'>,
  tarifa: number = TARIFA_HORA_USD,
): boolean {
  if (paquete.precioUsd === null || paquete.horas <= 0) return true;
  const teorico = paquete.horas * tarifa;
  return Math.abs(paquete.precioUsd - teorico) / teorico <= TOLERANCIA_PRECIO;
}

/**
 * Si el cliente entra en el alcance del paquete.
 * Sin responder es `false` a propósito: el botón arranca deshabilitado.
 */
export function calificaParaComprar(
  paquete: Pick<Paquete, 'calificacion'>,
  respuestas: Record<string, string | undefined>,
): boolean {
  return paquete.calificacion.every((pregunta) => {
    const elegida = respuestas[pregunta.id];
    if (!elegida) return false;
    return pregunta.opciones.some((o) => o.valor === elegida && o.califica);
  });
}

/** A dónde mandamos al que no califica: el primer destino que aparece. */
export function destinoDe(
  paquete: Pick<Paquete, 'calificacion'>,
  respuestas: Record<string, string | undefined>,
): Destino | null {
  for (const pregunta of paquete.calificacion) {
    const elegida = respuestas[pregunta.id];
    const opcion = pregunta.opciones.find((o) => o.valor === elegida);
    if (opcion && !opcion.califica && opcion.hacia) return opcion.hacia;
  }
  return null;
}

export interface Pedido {
  paquete: Paquete;
  extras: Extra[];
  /** null cuando el paquete se cotiza en la llamada. */
  totalUsd: number | null;
  recurrenteUsd: number;
}

/** Lo que el cliente eligió, con su total. Es la base del presupuesto y del contrato. */
export function totalPedido(paquete: Paquete, extrasIds: string[], disponibles: Extra[]): Pedido {
  const elegidos = extrasIds
    .map((id) => disponibles.find((e) => e.id === id))
    .filter((e): e is Extra => Boolean(e));

  const suma = (lista: Extra[]) => lista.reduce((total, e) => total + e.precioUsd, 0);
  const unaVez = suma(elegidos.filter((e) => !e.recurrente));
  const porMes = suma(elegidos.filter((e) => e.recurrente));

  if (paquete.precioUsd === null) {
    return { paquete, extras: elegidos, totalUsd: null, recurrenteUsd: porMes };
  }

  if (paquete.recurrente) {
    return { paquete, extras: elegidos, totalUsd: unaVez, recurrenteUsd: paquete.precioUsd + porMes };
  }

  return { paquete, extras: elegidos, totalUsd: paquete.precioUsd + unaVez, recurrenteUsd: porMes };
}

/* -------------------------------------------------------------------------- */

function esLocalized(value: unknown): value is Localized<unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const claves = Object.keys(value as object);
  return claves.length === 2 && claves.includes('es') && claves.includes('en');
}

function vacio(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.some((v) => vacio(v));
  return value === null || value === undefined;
}

/** Los textos que no están en los dos idiomas. Vacío es que el catálogo está completo. */
export function textosFaltantes(servicios: Servicio[] = SERVICIOS): string[] {
  const faltan: string[] = [];

  const recorrer = (nodo: unknown, ruta: string) => {
    if (esLocalized(nodo)) {
      for (const locale of ['es', 'en'] as Locale[]) {
        if (vacio(nodo[locale])) faltan.push(`${ruta}.${locale}`);
      }
      return;
    }
    if (Array.isArray(nodo)) {
      nodo.forEach((item, i) => recorrer(item, `${ruta}[${i}]`));
      return;
    }
    if (nodo && typeof nodo === 'object') {
      for (const [clave, valor] of Object.entries(nodo)) recorrer(valor, `${ruta}.${clave}`);
    }
  };

  servicios.forEach((servicio) => recorrer(servicio, servicio.slug));
  return faltan;
}
