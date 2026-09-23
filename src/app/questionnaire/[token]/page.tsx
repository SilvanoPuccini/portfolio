'use client';

import { useParams } from 'next/navigation';

import { Cuestionario } from '@/components/site/Cuestionario';
import Reveal from '@/components/site/Reveal';

/**
 * Las preguntas previas a la llamada, cuando el cliente llega desde el correo.
 *
 * Es la misma pantalla que ve al agendar, con el mismo componente: si fueran
 * dos, arreglar una pregunta habría que hacerlo dos veces y una de las dos
 * terminaría vieja.
 *
 * Antes esta página estaba maquetada como el panel de administración, con
 * fondos y grises de ahí. La ve un cliente, no yo: va con el diseño del sitio.
 */

export default function QuestionnairePage() {
  const { token } = useParams<{ token: string }>();

  return (
    <main className="site-container flex min-h-[70vh] items-center py-16 sm:py-24">
      <div className="w-full max-w-3xl">
        <Reveal>
          <p className="technical-label">Antes de la llamada</p>
        </Reveal>
        <Reveal>
          <h1 className="mt-3 text-3xl font-medium text-text-primary sm:text-4xl">
            Contame de tu proyecto
          </h1>
        </Reveal>

        <Reveal as="div" className="mt-8">
          <Cuestionario token={token} />
        </Reveal>
      </div>
    </main>
  );
}
