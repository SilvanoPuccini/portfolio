import { Check, Download, Mail, MessageCircle } from 'lucide-react';

import Reveal from '@/components/site/Reveal';
import type { Locale } from '@/content/servicios';
import type { PasoDelProyecto } from '@/lib/leads/linea-de-tiempo';

/**
 * El cierre de la compra: gracias, y lo que viene.
 *
 * Después de cargar el material el cliente se quedaba en el formulario con
 * un cartel de «Listo». Acababa de pagar por algo que todavía no puede ver:
 * lo que necesita es saber que del otro lado hay alguien, qué va a pasar y
 * cuándo. Esta pantalla es eso.
 */

const copy = {
  es: {
    eyebrow: 'Proyecto en marcha',
    titulo: (nombre: string, paquete: string) => `¡Gracias, ${nombre}! Tu ${paquete} ya está en marcha`,
    bajada: 'Recibí todo tu material. Desde acá el trabajo es mío: te escribo con cada avance, así no tenés que preguntar.',
    camino: 'Lo que viene',
    firma: 'Voy a trabajar yo en tu proyecto, de punta a punta. Si necesitás algo, escribime y te contesto yo.',
    whatsapp: 'Escribime por WhatsApp',
    volver: 'Guardá el correo que te mandé: tiene el link para volver acá cuando quieras.',
    contrato: 'Tu contrato firmado',
    factura: (numero: string) => `Factura ${numero}`,
    facturaPendiente: 'La factura te llega por correo apenas la emita.',
    escribir: 'o por correo',
  },
  en: {
    eyebrow: 'Project underway',
    titulo: (nombre: string, paquete: string) => `Thank you, ${nombre}! Your ${paquete} is underway`,
    bajada: 'I have all your material. From here the work is on me: I will write to you with every step, so you never have to ask.',
    camino: 'What comes next',
    firma: 'I will personally work on your project, end to end. If you need anything, write to me and I will answer myself.',
    whatsapp: 'Message me on WhatsApp',
    volver: 'Keep the email I sent you: it has the link to come back here any time.',
    contrato: 'Your signed contract',
    factura: (numero: string) => `Invoice ${numero}`,
    facturaPendiente: 'The invoice will reach you by email as soon as it is issued.',
    escribir: 'or by email',
  },
} as const;

export function PedidoGracias({
  pedidoId, nombre, paquete, pasos, factura, contacto, whatsapp, locale,
}: {
  pedidoId: string;
  nombre: string;
  paquete: string;
  pasos: PasoDelProyecto[];
  factura: string | null;
  contacto: string | null;
  /** El chat con el mensaje ya escrito. Es el canal principal. */
  whatsapp: string;
  locale: Locale;
}) {
  const t = copy[locale];
  const primerNombre = nombre.trim().split(/\s+/)[0] || nombre;

  return (
    <div className="grid gap-6">
      <Reveal as="section" className="surface-panel border border-brand-primary/30 px-6 py-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/15">
          <Check className="h-5 w-5 text-brand-primary" aria-hidden="true" />
        </span>
        <p className="technical-label mt-5 text-brand-primary">{t.eyebrow}</p>
        <h2 className="section-title-sm mt-2 text-balance">{t.titulo(primerNombre, paquete)}</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">{t.bajada}</p>
      </Reveal>

      <Reveal as="section" className="surface-panel px-6 py-7">
        <h3 className="technical-label">{t.camino}</h3>
        <ol className="mt-5 grid gap-0">
          {pasos.map((paso, i) => (
            <li key={paso.id} className="relative grid grid-cols-[28px_1fr] gap-4 pb-6 last:pb-0">
              {i < pasos.length - 1 && (
                <span aria-hidden="true" className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-outline-ghost/20" />
              )}
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border ${
                  paso.hecho
                    ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                    : 'border-outline-ghost/30 text-text-tertiary'
                }`}
              >
                {paso.hecho ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <div>
                <p className={`text-base font-semibold ${paso.hecho ? 'text-text-secondary' : 'text-text-primary'}`}>
                  {paso.titulo}
                  {paso.hecho && <span className="sr-only"> ✓</span>}
                </p>
                {paso.fecha && <p className="mt-0.5 text-sm font-medium text-brand-primary first-letter:uppercase">{paso.fecha}</p>}
                {paso.detalle && <p className="mt-1 text-sm leading-6 text-text-tertiary">{paso.detalle}</p>}
              </div>
            </li>
          ))}
        </ol>
      </Reveal>

      <Reveal as="section" className="surface-panel px-6 py-7">
        <p className="max-w-xl text-base leading-7 text-text-secondary">{t.firma}</p>
        {/* La firma de la marca, la misma que va en el contrato. */}
        <p
          className="mt-3 text-4xl leading-none text-text-primary"
          style={{ fontFamily: 'var(--font-firma), cursive' }}
          aria-label="Silvano Puccini"
        >
          SilvanoPuccini.dev
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-primary gap-2">
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t.whatsapp}</span>
          </a>
          {contacto && (
            <a
              href={`mailto:${contacto}`}
              className="inline-flex items-center gap-2 text-sm text-text-secondary underline decoration-outline-ghost/30 underline-offset-4 transition-colors hover:text-text-primary"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t.escribir} ({contacto})
            </a>
          )}
        </div>

        <div className="mt-7 grid gap-2 border-t border-outline-ghost/10 pt-5 text-sm">
          <a
            href={`/api/pedido/${pedidoId}/contrato-firmado`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-text-secondary underline decoration-outline-ghost/30 underline-offset-4 transition-colors hover:text-text-primary"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t.contrato}
          </a>
          <span className="text-text-tertiary">{factura ? t.factura(factura) : t.facturaPendiente}</span>
          <span className="text-text-tertiary">{t.volver}</span>
        </div>
      </Reveal>
    </div>
  );
}
