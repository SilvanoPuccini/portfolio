/**
 * El alcance de cada paquete, en el idioma de un contrato.
 *
 * El catálogo le habla al cliente en primera persona y con voseo: «los textos
 * los escribo yo a partir de lo que me contás». Está bien para vender y está
 * mal para obligarse: el contrato copiaba esas frases tal cual, y un paquete
 * que decía «Todo lo de la Landing» dejaba el alcance escondido en otro
 * paquete que el contrato ni mencionaba.
 *
 * Acá cada paquete dice lo mismo que en la página —ni más ni menos—, pero
 * completo, en tercera persona y medible. El test de este archivo verifica
 * que ningún paquete con precio cerrado se quede sin su alcance.
 */

export interface AlcanceContractual {
  /** Qué se contrata, en una oración. Va en la cláusula OBJETO. */
  objeto: string;
  /** Lo que se entrega, uno por renglón. Autocontenido: nunca «todo lo de…». */
  entregables: string[];
}

const LANDING: string[] = [
  'Diseño y desarrollo de una (1) página web de sección única, adaptada a celulares, tabletas y computadoras.',
  'Redacción de los textos de la página por parte del Proveedor, a partir de la información que suministre el Cliente.',
  'Selección de imágenes de bancos de uso libre acordes al rubro del Cliente.',
  'Botón de contacto por WhatsApp y formulario de contacto con envío a la casilla de correo que indique el Cliente.',
  'Optimización técnica para buscadores (SEO técnico) y para una carga rápida en celulares.',
  'Inserción de un (1) video alojado en YouTube o Instagram.',
];

const CINCO_SECCIONES: string[] = [
  'Diseño y desarrollo de un sitio web de hasta cinco (5) secciones, adaptado a celulares, tabletas y computadoras.',
  'Redacción de los textos del sitio por parte del Proveedor, a partir de la información que suministre el Cliente.',
  'Selección de imágenes de bancos de uso libre acordes al rubro del Cliente.',
  'Botón de contacto por WhatsApp y formulario de contacto con envío a la casilla de correo que indique el Cliente.',
  'Optimización técnica para buscadores (SEO técnico) y para una carga rápida en celulares.',
  'Investigación de palabras clave del rubro y la zona del Cliente, aplicada a los textos del sitio.',
  'Sección de videos con hasta cuatro (4) videos alojados en YouTube o Instagram.',
  'Alta o actualización del Perfil de Empresa de Google del Cliente con los datos del negocio.',
];

const CATALOGO_WHATSAPP: string[] = [
  'Diseño y desarrollo de un catálogo web de productos con categorías, buscador y ficha de cada producto, adaptado a celulares y computadoras.',
  'Carrito de compras que arma el pedido y lo envía al WhatsApp del Cliente.',
  'Panel de administración para que el Cliente cargue y edite productos, precios y fotografías.',
  'Aviso por correo electrónico al Cliente por cada pedido recibido.',
];

export const ALCANCE_POR_PAQUETE: Record<string, AlcanceContractual> = {
  landing: {
    objeto: 'el diseño, desarrollo y publicación de una página web de sección única (landing page) orientada a que los visitantes contacten al Cliente',
    entregables: LANDING,
  },
  'web-cinco-secciones': {
    objeto: 'el diseño, desarrollo y publicación de un sitio web institucional de hasta cinco (5) secciones',
    entregables: CINCO_SECCIONES,
  },
  'web-con-blog': {
    objeto: 'el diseño, desarrollo y publicación de un sitio web institucional con blog',
    entregables: [
      ...CINCO_SECCIONES,
      'Blog con categorías y buscador, administrable por el Cliente.',
      'Redacción y publicación de los tres (3) primeros artículos del blog.',
      'Configuración de analítica web y envío de un informe mensual automático por correo electrónico.',
    ],
  },
  'catalogo-whatsapp': {
    objeto: 'el diseño, desarrollo y publicación de un catálogo web de productos con pedidos por WhatsApp',
    entregables: CATALOGO_WHATSAPP,
  },
  'catalogo-cobro': {
    objeto: 'el diseño, desarrollo y publicación de un catálogo web de productos con cobro en línea',
    entregables: [
      ...CATALOGO_WHATSAPP,
      'Cobro mediante link de pago de Mercado Pago, con confirmación automática del pago.',
      'Cobro por transferencia bancaria con carga de comprobante, confirmado manualmente por el Cliente.',
      'Seguimiento del estado de cada pedido: pendiente, pago informado y pagado.',
      'Correo electrónico automático al comprador en cada cambio de estado del pedido.',
    ],
  },
  'una-automatizacion': {
    objeto: 'el relevamiento, desarrollo y puesta en marcha de una (1) automatización de un proceso del Cliente',
    entregables: [
      'Relevamiento del proceso y documento escrito que lo describe, previo a cualquier desarrollo.',
      'Automatización del proceso relevado, funcionando de punta a punta, con aviso ante errores.',
      'Tablero de control donde el Cliente puede consultar qué ejecuciones corrieron y cuáles fallaron.',
    ],
  },
  'tres-automatizaciones': {
    objeto: 'el relevamiento, desarrollo y puesta en marcha de tres (3) automatizaciones conectadas entre sí dentro de un mismo circuito del Cliente',
    entregables: [
      'Relevamiento de los tres (3) procesos y documento escrito que los describe, previo a cualquier desarrollo.',
      'Tres (3) automatizaciones funcionando de punta a punta, cada una con aviso ante errores.',
      'Integración entre las tres automatizaciones: la salida de cada una alimenta a la siguiente.',
      'Tablero de control donde el Cliente puede consultar qué ejecuciones corrieron y cuáles fallaron.',
      'Informe mensual de las ejecuciones realizadas y del tiempo ahorrado.',
    ],
  },
  'auditoria-web': {
    objeto: 'la auditoría técnica de un sitio web existente del Cliente',
    entregables: [
      'Revisión de velocidad de carga, SEO técnico, accesibilidad y seguridad básica del sitio.',
      'Informe escrito con los hallazgos, ordenados por prioridad y con su costo estimado de corrección.',
      'Una (1) reunión por videollamada de hasta treinta (30) minutos para repasar el informe.',
      'Si el Cliente contrata al Proveedor para corregir lo informado, el precio de esta auditoría se descuenta de ese proyecto.',
    ],
  },
  'cuidado-basico': {
    objeto: 'el mantenimiento mensual del sitio web del Cliente, plan Básico',
    entregables: [
      'Hasta dos (2) cambios menores por mes. Los cambios no utilizados no se acumulan.',
      'Respuesta a los pedidos del Cliente dentro de las setenta y dos (72) horas hábiles.',
      'Copia de seguridad semanal del sitio.',
      'Actualizaciones de seguridad del sitio y sus dependencias.',
    ],
  },
  'cuidado-completo': {
    objeto: 'el mantenimiento y la mejora mensual del sitio web del Cliente, plan Completo',
    entregables: [
      'Hasta cinco (5) cambios menores por mes. Los cambios no utilizados no se acumulan.',
      'Respuesta a los pedidos del Cliente dentro de las veinticuatro (24) horas hábiles.',
      'Copia de seguridad diaria del sitio.',
      'Actualizaciones de seguridad del sitio y sus dependencias.',
      'Informe mensual de visitas y consultas recibidas.',
    ],
  },
  'cuidado-comercio': {
    objeto: 'el mantenimiento mensual del sitio web comercial del Cliente, plan Comercio',
    entregables: [
      'Hasta ocho (8) cambios menores por mes. Los cambios no utilizados no se acumulan.',
      'Respuesta a los pedidos del Cliente dentro del mismo día hábil.',
      'Copia de seguridad diaria del sitio y monitoreo de caídas.',
      'Actualizaciones de seguridad del sitio y sus dependencias.',
      'Carga de productos y actualización de precios.',
    ],
  },
};

/** Cada adicional, como entregable. La clave es el `id` del extra en el catálogo. */
export const ALCANCE_POR_EXTRA: Record<string, string> = {
  logo: 'Logotipo tipográfico: dos (2) propuestas y una (1) ronda de ajustes sobre la elegida, entregado en formatos para web y redes.',
  agenda: 'Agenda de turnos en línea: el visitante reserva por sí mismo y el turno se registra en el calendario del Cliente.',
  panel: 'Panel de administración para que el Cliente edite por sí mismo los textos y las imágenes del sitio.',
  pago: 'Botón de pago mediante link de Mercado Pago para cobrar una seña o un producto.',
  idioma: 'Versión completa del sitio en un segundo idioma (inglés o portugués), con la traducción incluida.',
  video: 'Video animado de presentación de hasta treinta (30) segundos con la marca del Cliente, para la portada del sitio y redes sociales.',
  stock: 'Control de stock: descuento automático al vender y aviso cuando un producto está por agotarse.',
  cupones: 'Cupones de descuento configurables por el Cliente.',
  envios: 'Costo de envío por zona y opción de retiro en el local.',
  'plan-automatizacion': 'Plan mensual de monitoreo de las automatizaciones: seguimiento, aviso ante fallas y consumo de servicios de IA incluido.',
};
