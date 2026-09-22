import type { Extra, Localized, Paquete } from './servicios';
import { servicioPorSlug } from './servicios';

/**
 * Lo que se le pide al cliente para poder arrancar.
 *
 * Sale del paquete que compró y de los extras que tildó: una landing no
 * necesita lo mismo que un catálogo con cobro, y pedirle todo a todos es la
 * forma más rápida de que nadie complete nada.
 *
 * Una regla que no se negocia: acá NO se piden contraseñas. Para entrar a
 * una cuenta del cliente se pide que me sume como colaborador, y si alguna
 * vez hace falta una clave va por un canal que expira, nunca por un
 * formulario. Un formulario con contraseñas adentro es una filtración
 * esperando una fecha.
 */

export type TipoDato = 'texto' | 'parrafo' | 'archivo' | 'enlace';

export interface DatoKickoff {
  id: string;
  label: Localized<string>;
  ayuda: Localized<string>;
  tipo: TipoDato;
  /** Sin esto no se puede empezar. Todo lo demás se resuelve sobre la marcha. */
  obligatorio: boolean;
  /** Varios archivos, como las fotos. */
  multiple?: boolean;
}

/** Lo que hace falta siempre, sea cual sea el paquete. */
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

/** Lo propio de cada servicio, además de lo básico. */
const POR_SERVICIO: Record<string, DatoKickoff[]> = {
  web: [
    {
      id: 'secciones',
      label: { es: '¿Qué secciones querés?', en: 'Which sections do you want?' },
      ayuda: {
        es: 'Por ejemplo: quiénes somos, servicios, precios, contacto. Si no sabés, propongo yo.',
        en: 'For example: about, services, pricing, contact. If unsure, I will propose them.',
      },
      tipo: 'parrafo',
      obligatorio: false,
    },
  ],
  tienda: [
    {
      id: 'productos',
      label: { es: 'Tu lista de productos', en: 'Your product list' },
      ayuda: {
        es: 'Una planilla con nombre, precio y descripción. Si la tenés en otro formato, mandala igual.',
        en: 'A spreadsheet with name, price and description. Any other format works too.',
      },
      tipo: 'archivo',
      obligatorio: true,
    },
    {
      id: 'envios',
      label: { es: '¿Cómo entregás?', en: 'How do you deliver?' },
      ayuda: {
        es: 'Retiro en el local, envío propio por zonas, correo. Con los costos si los tenés.',
        en: 'Pickup, your own delivery by area, courier. With costs if you have them.',
      },
      tipo: 'parrafo',
      obligatorio: false,
    },
    {
      id: 'cobro',
      label: { es: 'Tu cuenta para cobrar', en: 'Your account to get paid' },
      ayuda: {
        es: 'El alias o CBU que querés mostrar, y si tenés Mercado Pago, el mail de esa cuenta. '
          + 'No me mandes contraseñas: para conectar Mercado Pago me sumás como usuario desde tu panel.',
        en: 'The bank alias you want shown, and your Mercado Pago account email if you have one. '
          + 'Do not send passwords: you add me as a user from your own panel.',
      },
      tipo: 'parrafo',
      obligatorio: true,
    },
  ],
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
  pago: [
    {
      id: 'cobro',
      label: { es: 'Tu cuenta para cobrar', en: 'Your account to get paid' },
      ayuda: {
        es: 'El alias o CBU, y el mail de tu cuenta de Mercado Pago si la tenés. Sin contraseñas.',
        en: 'Your bank alias, and your Mercado Pago account email if you have one. No passwords.',
      },
      tipo: 'texto',
      obligatorio: true,
    },
  ],
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

/**
 * Todo lo que hay que pedirle a este cliente, sin repetir.
 *
 * El orden importa: primero lo básico, que es lo que cualquiera puede
 * contestar de memoria, y después lo específico, que puede requerir buscar
 * algo. Empezar por lo difícil es empezar por el abandono.
 */
export function datosKickoff(
  paquete: Paquete,
  extrasIds: string[],
  extrasDisponibles: Extra[] = [],
): DatoKickoff[] {
  const servicio = servicioPorSlug(paquete.servicio);

  const elegidos = extrasIds.filter((id) =>
    extrasDisponibles.length === 0 || extrasDisponibles.some((extra) => extra.id === id));

  const todos = [
    ...DATOS_BASE,
    ...(POR_SERVICIO[servicio?.slug ?? ''] ?? []),
    ...elegidos.flatMap((id) => POR_EXTRA[id] ?? []),
  ];

  const vistos = new Set<string>();
  return todos.filter((dato) => (vistos.has(dato.id) ? false : (vistos.add(dato.id), true)));
}
