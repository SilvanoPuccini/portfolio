'use client';

import { useState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';

/**
 * «Perdí el link de mi pedido».
 *
 * El link es un uuid que vive en la barra del navegador. Quien lo perdía y no
 * encontraba el correo empezaba de cero, y ahí nacía un segundo lead del
 * mismo cliente con otro pedido a medias.
 *
 * El link va al correo, nunca a la pantalla: mostrarlo acá abriría el pedido
 * de cualquiera con solo saber su dirección.
 */
export function RecuperarPedido() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState('');
  const [error, setError] = useState('');

  async function pedir(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setError('');

    try {
      const res = await fetch('/api/pedido/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json() as { mensaje?: string; error?: string };

      if (!res.ok) {
        setError(body.error ?? 'No se pudo. Probá de nuevo en un momento.');
        return;
      }
      setListo(body.mensaje ?? 'Listo, fijate en tu correo.');
    } catch {
      setError('Se cortó la conexión. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="surface-panel border border-brand-primary/25 px-6 py-8">
        <MailCheck className="h-6 w-6 text-brand-primary" aria-hidden="true" />
        <h2 className="section-title-sm mt-4">Fijate en tu correo</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">{listo}</p>
        <p className="mt-4 text-sm leading-6 text-text-tertiary">
          Si no llega en unos minutos, mirá en spam. Y si tampoco está, escribime y lo resolvemos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={pedir} className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="section-title-sm">Tu correo</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
        El mismo con el que empezaste. Te mando el link que te deja en el paso donde quedaste.
      </p>

      <label className="mt-6 block max-w-md">
        <span className="technical-label">Email</span>
        <input
          type="email"
          required
          className="form-field mt-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

      <button type="submit" className="button-primary mt-6 gap-2" disabled={enviando}>
        <span>{enviando ? 'Buscando…' : 'Mandame el link'}</span>
        {!enviando && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </button>

      <p className="mt-3 text-xs leading-5 text-text-tertiary">
        El link va a tu correo y no se muestra acá: es la única forma de que nadie más
        pueda abrir tu pedido sabiendo tu dirección.
      </p>
    </form>
  );
}
