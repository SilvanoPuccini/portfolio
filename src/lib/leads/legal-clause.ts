import { countryOf } from './payment-instructions';

/**
 * La cláusula de ley aplicable y jurisdicción.
 *
 * Antes la escribía un modelo de IA en cada descarga. Eso tenía tres
 * problemas, y el tercero ya pasó: el contrato salía distinto cada vez que se
 * bajaba, nadie revisaba lo que decía, y el prefacio del modelo terminó
 * impreso adentro del documento —un contrato real decía «Aquí tienes una
 * propuesta:» justo antes de la cláusula de jurisdicción—.
 *
 * Un párrafo legal no se improvisa por descarga. Son tres textos fijos,
 * escritos una vez, que se eligen por el país del cliente. Si mañana hay que
 * cambiarlos, se cambian acá y cambian para todos.
 */

const ARGENTINA =
  'El presente contrato se regirá e interpretará conforme a las leyes de la República Argentina. '
  + 'Para la resolución de cualquier controversia derivada del mismo, las partes se someten '
  + 'irrevocablemente a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de '
  + 'Buenos Aires, renunciando a cualquier otro fuero o jurisdicción que pudiera corresponderles.';

const CHILE =
  'El presente contrato se regirá e interpretará conforme a las leyes de la República Argentina, '
  + 'país donde el Proveedor presta sus servicios. Las partes procurarán resolver de buena fe '
  + 'cualquier controversia derivada del mismo y, de no alcanzar un acuerdo, se someten a la '
  + 'jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, República '
  + 'Argentina, sin perjuicio de los derechos que la legislación chilena reconozca al Cliente en '
  + 'su carácter de consumidor.';

const INTERNACIONAL =
  'El presente contrato se regirá e interpretará conforme a las leyes de la República Argentina, '
  + 'país donde el Proveedor presta sus servicios. Las partes procurarán resolver de buena fe '
  + 'cualquier controversia derivada del mismo y, de no alcanzar un acuerdo, se someten a la '
  + 'jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, República '
  + 'Argentina.';

/**
 * La misma cláusula, en una línea.
 *
 * El contrato que se firma en Documenso no lleva el párrafo entero: lleva un
 * campo de una línea dentro de una frase que ya está escrita en el PDF. Un
 * párrafo ahí se corta a la mitad, y un contrato con la jurisdicción partida
 * al medio no es un contrato.
 */
const CORTAS: Record<string, string> = {
  AR: 'las leyes de Argentina y los tribunales ordinarios de la Ciudad de Buenos Aires',
  CL: 'las leyes de Argentina y los tribunales de Buenos Aires, sin afectar la ley chilena del consumidor',
};

const CORTA_INTERNACIONAL = 'las leyes de Argentina y los tribunales ordinarios de la Ciudad de Buenos Aires';

export function jurisdiccionCorta(pais: string | null | undefined): string {
  return CORTAS[countryOf(pais)] ?? CORTA_INTERNACIONAL;
}

export function legalClauseFor(pais: string | null | undefined): string {
  const country = countryOf(pais);
  if (country === 'AR') return ARGENTINA;
  if (country === 'CL') return CHILE;
  return INTERNACIONAL;
}
