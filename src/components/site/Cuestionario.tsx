'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

/**
 * Las preguntas previas a la llamada, con el diseño del sitio.
 *
 * Vive acá y no dentro de una página porque se usa en dos lugares: en la
 * pantalla donde el cliente acaba de agendar, para el que quiere resolverlo
 * en el momento, y en su propia página, para el que llega desde el correo.
 *
 * Son solo las que a ese cliente le faltan: el servidor las arma mirando lo
 * que ya contestó. Ninguna es obligatoria; lo que no conteste se habla en la
 * llamada, y decirlo baja el abandono más que cualquier otra cosa.
 */

interface Pregunta {
  key: string;
  text: string;
  hint: string;
  opciones?: string[];
}

type Estado = 'cargando' | 'listo' | 'enviando' | 'enviado' | 'completado' | 'error';

export function Cuestionario({ token, compacto = false }: { token: string; compacto?: boolean }) {
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<Estado>('cargando');
  const [error, setError] = useState('');

  /**
   * Las preguntas se vuelven a pedir cuando elige un servicio.
   *
   * Es la rama: lo que contesta en la primera pregunta define lo que se le
   * pregunta después. Pedirlas de nuevo al servidor es más simple y más
   * confiable que replicar acá la lógica de qué abre cada opción.
   */
  const servicio = respuestas.servicio ?? '';

  useEffect(() => {
    if (!token) return;

    const url = `/api/questionnaire/check?token=${encodeURIComponent(token)}`
      + (servicio ? `&servicio=${encodeURIComponent(servicio)}` : '');

    fetch(url)
      .then(async (res) => {
        if (!res.ok) return setEstado('error');
        const body = await res.json() as { completed?: boolean; questions?: Pregunta[] };
        if (body.completed) return setEstado('completado');
        setPreguntas(body.questions ?? []);
        setEstado((actual) => (actual === 'cargando' ? 'listo' : actual));
      })
      .catch(() => setEstado('error'));
  }, [token, servicio]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    setEstado('enviando');
    setError('');

    try {
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: respuestas }),
      });

      if (res.ok) return setEstado('enviado');
      if (res.status === 409) return setEstado('completado');

      setError('No se pudieron guardar. Probá de nuevo: no se perdió lo que escribiste.');
      setEstado('listo');
    } catch {
      setError('Se cortó la conexión. Probá de nuevo: no se perdió lo que escribiste.');
      setEstado('listo');
    }
  }

  if (estado === 'cargando') return null;

  if (estado === 'error') {
    return (
      <p className="text-sm leading-6 text-text-tertiary">
        No pude cargar las preguntas. Las vemos en la llamada.
      </p>
    );
  }

  if (estado === 'enviado' || estado === 'completado') {
    return (
      <div className="surface-panel border border-brand-primary/25 px-6 py-7">
        <Check className="h-5 w-5 text-brand-primary" aria-hidden="true" />
        <p className="section-title-sm mt-3">
          {estado === 'enviado' ? 'Listo, ya las tengo' : 'Ya las habías contestado'}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          Con esto llego a la llamada entendiendo tu situación. Nos vemos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <p className="text-sm leading-6 text-text-secondary">
        {preguntas.length === 1
          ? 'Queda una sola pregunta: el resto ya me lo contaste.'
          : `Son ${preguntas.length} preguntas y te llevan unos minutos.`}{' '}
        Si algo no lo sabés, dejalo vacío y lo vemos hablando.
      </p>

      <div className={`mt-7 grid gap-6 ${compacto ? '' : 'sm:grid-cols-2'}`}>
        {preguntas.map((pregunta, i) => (
          <label key={pregunta.key} className={pregunta.opciones ? 'block' : 'block sm:col-span-2'}>
            <span className="text-sm font-medium text-text-primary">
              {i + 1}. {pregunta.text}
            </span>
            {/* El ejemplo va arriba del campo: en el placeholder desaparece
                justo cuando se empieza a escribir, que es cuando hace falta. */}
            <span className="mt-1 block text-xs leading-5 text-text-tertiary">{pregunta.hint}</span>

            {pregunta.opciones ? (
              <select
                className="form-field mt-2"
                value={respuestas[pregunta.key] ?? ''}
                onChange={(event) =>
                  setRespuestas((r) => ({ ...r, [pregunta.key]: event.target.value }))}
              >
                <option value="">Elegí una opción</option>
                {pregunta.opciones.map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            ) : (
              <textarea
                rows={3}
                className="form-field mt-2 resize-y"
                value={respuestas[pregunta.key] ?? ''}
                onChange={(event) =>
                  setRespuestas((r) => ({ ...r, [pregunta.key]: event.target.value }))}
              />
            )}
          </label>
        ))}
      </div>

      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

      <button type="submit" className="button-primary mt-7" disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Guardando…' : 'Enviar respuestas'}
      </button>
    </form>
  );
}
