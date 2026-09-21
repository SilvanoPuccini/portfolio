/**
 * En qué punto del circuito está el cliente, y qué le toca ver.
 *
 * Hasta ahora el cliente recibía un link para el cuestionario, otro para la
 * propuesta y otro para firmar. Tres correos, tres pantallas, y la pregunta
 * «¿cuál era el link?» cada vez. Ahora guarda uno solo y siempre lo lleva a lo
 * que le toca ahora.
 *
 * Se resuelve de adelante hacia atrás: gana la etapa más avanzada. Mandar a
 * alguien de vuelta al cuestionario cuando ya tiene la propuesta en la mano es
 * hacerlo retroceder.
 */

export type EtapaCliente = 'cuestionario' | 'propuesta' | 'firma' | 'listo' | 'cerrada' | 'espera';

export interface EstadoDelCliente {
  cuestionarioToken: string | null;
  cuestionarioCompleto: boolean;
  propuestaToken: string | null;
  propuestaEnviada: boolean;
  propuestaRespuesta: string | null;
  contratoFirmadoAt: string | null;
}

export interface EtapaResuelta {
  etapa: EtapaCliente;
  /** A dónde llevarlo. `null` cuando la pantalla se muestra en el mismo lugar. */
  href: string | null;
}

export function etapaDelCliente(estado: EstadoDelCliente): EtapaResuelta {
  if (estado.contratoFirmadoAt) return { etapa: 'listo', href: null };

  const propuesta = estado.propuestaEnviada && estado.propuestaToken
    ? `/propuesta/${estado.propuestaToken}`
    : null;

  if (propuesta) {
    // La firma vive dentro de la propuesta: es la misma pantalla, con el paso
    // siguiente ya abierto.
    if (estado.propuestaRespuesta === 'aceptada') return { etapa: 'firma', href: propuesta };
    if (estado.propuestaRespuesta === 'rechazada') return { etapa: 'cerrada', href: null };
    return { etapa: 'propuesta', href: propuesta };
  }

  if (estado.cuestionarioToken && !estado.cuestionarioCompleto) {
    return { etapa: 'cuestionario', href: `/questionnaire/${estado.cuestionarioToken}` };
  }

  return { etapa: 'espera', href: null };
}

/**
 * El link que se manda al cliente.
 *
 * Siempre el mismo, sin importar la etapa. Si por lo que sea el lead todavía
 * no tiene su token, se cae al link puntual de ese paso: es preferible un link
 * viejo que un correo con una dirección rota.
 */
export function clienteUrl(
  siteUrl: string,
  leadToken: string | null | undefined,
  fallback: string,
): string {
  return leadToken ? `${siteUrl}/cliente/${leadToken}` : fallback;
}
