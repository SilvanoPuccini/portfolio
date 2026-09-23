'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import type { Locale } from '@/content/servicios';
import { Cuestionario } from './Cuestionario';

/**
 * Lo mínimo para que la llamada exista, y después el calendario.
 *
 * Son cinco campos y ninguno de más. Cada campo extra antes de agendar es
 * gente que abandona, y lo demás lo pregunta el cuestionario, que llega
 * después y solo con lo que falte.
 *
 * Importa que el lead se cree ACÁ: el webhook de Cal.com actualiza por mail,
 * no da de alta. Sin este paso, quien reserva un horario sin haber pasado por
 * el formulario no queda registrado en ningún lado.
 */

const copy = {
  es: {
    titulo: 'Dejame tus datos y elegí el horario',
    bajada: 'Cinco campos. Lo demás lo hablamos en la llamada.',
    nombre: 'Tu nombre',
    email: 'Tu email',
    telefono: 'Tu WhatsApp',
    pais: 'Desde dónde escribís',
    problema: '¿Qué necesitás? Contámelo en dos líneas',
    enviar: 'Ver horarios',
    enviando: 'Un segundo…',
    error: 'No se pudo guardar. Revisá el mail y probá de nuevo: no se perdió lo que escribiste.',
    calendario: 'Agendar la llamada',
    adelantar: 'Opcional, cinco minutos',
    adelantarTitulo: 'Ya que estás, contame un poco',
    adelantarBajada: 'Si me contestás esto ahora, llego a la llamada entendiendo tu situación y '
      + 'los 45 minutos los usamos para resolver. También te llega por correo: si preferís, lo '
      + 'hacés más tarde.',
    sinCalendario: 'Estoy configurando el calendario. Escribime y coordinamos por mail.',
    escribir: 'Escribime un mail',
    paises: ['Argentina', 'Chile', 'Uruguay', 'México', 'España', 'Otro'],
  },
  en: {
    titulo: 'Leave your details and pick a time',
    bajada: 'Five fields. We cover the rest on the call.',
    nombre: 'Your name',
    email: 'Your email',
    telefono: 'Your WhatsApp',
    pais: 'Where you are writing from',
    problema: 'What do you need? Two lines is enough',
    enviar: 'See available times',
    enviando: 'One moment…',
    error: 'Could not save it. Check the email and try again: nothing you wrote was lost.',
    calendario: 'Schedule the call',
    adelantar: 'Optional, five minutes',
    adelantarTitulo: 'While you are here, tell me a bit',
    adelantarBajada: 'If you answer this now, I arrive at the call already understanding your '
      + 'situation. It also goes to your inbox: do it later if you prefer.',
    sinCalendario: 'I am setting up the calendar. Write to me and we will coordinate by email.',
    escribir: 'Send me an email',
    paises: ['Argentina', 'Chile', 'Uruguay', 'Mexico', 'Spain', 'Other'],
  },
} as const;

type Estado = 'form' | 'enviando' | 'error' | 'listo';

export default function QuickIntake({
  locale,
  calcomLink,
  service,
  paquete,
  email: contactEmail,
}: {
  locale: Locale;
  calcomLink: string | null;
  service?: string;
  paquete?: string;
  email?: string;
}) {
  const labels = copy[locale];
  const [estado, setEstado] = useState<Estado>('form');
  const [cuestionario, setCuestionario] = useState<string | null>(null);
  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    telefono: '',
    pais: labels.paises[0],
    problema: '',
  });

  const cambiar = (campo: keyof typeof datos) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setDatos((actuales) => ({ ...actuales, [campo]: event.target.value }));

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    setEstado('enviando');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          problema: datos.problema,
          canal_llamada: 'cal.com',
          service: service ?? null,
          // El paquete y el país viajan acá: el panel los usa para pretildar el
          // presupuesto y para saber en qué moneda se cotiza.
          service_data: { paquete: paquete ?? null, pais: datos.pais },
        }),
      });

      if (res.ok) {
        const body = await res.json().catch(() => ({})) as { cuestionario?: string | null };
        setCuestionario(body.cuestionario ?? null);
      }
      setEstado(res.ok ? 'listo' : 'error');
    } catch {
      setEstado('error');
    }
  }

  if (!calcomLink) {
    return (
      <div className="surface-panel border border-outline-ghost/10 px-6 py-10 text-center sm:px-12">
        <p className="mx-auto max-w-lg text-base leading-7 text-text-secondary">
          {labels.sinCalendario}
        </p>
        {contactEmail && (
          <a href={`mailto:${contactEmail}`} className="button-primary mt-6 inline-flex">
            {labels.escribir}
          </a>
        )}
      </div>
    );
  }

  if (estado === 'listo') {
    const url = `${calcomLink}?${new URLSearchParams({
      name: datos.nombre,
      email: datos.email,
    }).toString()}`;

    return (
      <div className="space-y-6">
        <div className="surface-panel overflow-hidden border border-outline-ghost/10">
          <iframe src={url} title={labels.calendario} className="h-[700px] w-full border-0" loading="lazy" />
        </div>

        {/* Las preguntas, acá mismo. El que las contesta ahora no tiene que
            abrir ningún correo, y el que no, las recibe igual: son las mismas
            y el link es el mismo. */}
        {cuestionario && (
          <div className="surface-panel border border-outline-ghost/10 px-5 py-7 sm:px-8">
            <p className="technical-label">{labels.adelantar}</p>
            <h2 className="section-title-sm mt-3">{labels.adelantarTitulo}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              {labels.adelantarBajada}
            </p>
            <div className="mt-6">
              <Cuestionario token={cuestionario} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-8 sm:py-8"
    >
      <h2 className="section-title-sm">{labels.titulo}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{labels.bajada}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="technical-label">{labels.nombre}</span>
          <input
            type="text"
            required
            className="form-field mt-2"
            value={datos.nombre}
            onChange={cambiar('nombre')}
          />
        </label>

        <label className="block">
          <span className="technical-label">{labels.email}</span>
          <input
            type="email"
            required
            className="form-field mt-2"
            value={datos.email}
            onChange={cambiar('email')}
          />
        </label>

        <label className="block">
          <span className="technical-label">{labels.telefono}</span>
          <input
            type="tel"
            className="form-field mt-2"
            value={datos.telefono}
            onChange={cambiar('telefono')}
          />
        </label>

        <label className="block">
          <span className="technical-label">{labels.pais}</span>
          <select className="form-field mt-2" value={datos.pais} onChange={cambiar('pais')}>
            {labels.paises.map((pais) => (
              <option key={pais} value={pais}>{pais}</option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="technical-label">{labels.problema}</span>
          <textarea
            rows={3}
            className="form-field mt-2 resize-y"
            value={datos.problema}
            onChange={cambiar('problema')}
          />
        </label>
      </div>

      {estado === 'error' && (
        <p role="alert" className="mt-4 text-sm leading-6 text-red-400">
          {labels.error}
        </p>
      )}

      <button type="submit" className="button-primary mt-6 gap-2" disabled={estado === 'enviando'}>
        <span>{estado === 'enviando' ? labels.enviando : labels.enviar}</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    </form>
  );
}
