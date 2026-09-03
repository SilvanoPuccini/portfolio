/**
 * Tabla de arquitectura de referencia del post "Mi stack no es una lista de
 * tecnologías".
 *
 * No usa `Diagram` como los demás bloques del post: aquellos son ilustraciones
 * de ancho fijo que se escalan, y acá el contenido es texto que hay que poder
 * leer. Un escalado a 880px deja letra de 9px en un teléfono. Por eso es
 * fluido: grilla de tres columnas en pantalla ancha, tarjetas apiladas con su
 * etiqueta abajo de cierto ancho.
 */

const ROWS = [
  {
    need: 'Contenido público, SEO y renderizado híbrido',
    pick: 'Next.js con TypeScript',
    open: 'Caché, ejecución en servidor y plataforma de despliegue',
  },
  {
    need: 'Aplicación interna o frontend desacoplado',
    pick: 'React con Vite y TypeScript',
    open: 'Contrato de API, autenticación y publicación del frontend',
  },
  {
    need: 'Reglas de negocio, usuarios, permisos y administración',
    pick: 'Django',
    open: 'Límites del dominio, API, tareas y estrategia de despliegue',
  },
  {
    need: 'Servicios concurrentes o procesos de red bien delimitados',
    pick: 'Go',
    open: 'Contratos, observabilidad y necesidad real de separar el servicio',
  },
  {
    need: 'Datos relacionales y consistencia',
    pick: 'PostgreSQL',
    open: 'Modelado, restricciones, migraciones, índices y recuperación',
  },
];

const HEADINGS = ['Necesidad dominante', 'Primera opción que evalúo', 'Decisión que todavía debo resolver'];

const eyebrow = 'font-mono text-[11px] uppercase tracking-[0.16em] text-text-tertiary';

export function StackReferenceTable() {
  return (
    <div className="not-prose my-10 overflow-hidden rounded-2xl border border-outline-ghost/20 bg-surface-dim/40">
      <div className="hidden gap-px border-b border-outline-ghost/15 bg-surface-elevated/40 px-6 py-4 md:grid md:grid-cols-[1.15fr_0.85fr_1.15fr] md:gap-6">
        {HEADINGS.map((heading) => (
          <div key={heading} className={eyebrow}>
            {heading}
          </div>
        ))}
      </div>

      <div className="divide-y divide-outline-ghost/10">
        {ROWS.map((row) => (
          <div
            key={row.pick}
            className="grid gap-4 px-6 py-5 transition-colors hover:bg-surface-elevated/25 md:grid-cols-[1.15fr_0.85fr_1.15fr] md:items-baseline md:gap-6"
          >
            <div>
              <div className={`${eyebrow} mb-1.5 md:hidden`}>{HEADINGS[0]}</div>
              <p className="m-0 text-[0.95rem] font-semibold leading-6 text-text-primary">{row.need}</p>
            </div>

            <div>
              <div className={`${eyebrow} mb-1.5 md:hidden`}>{HEADINGS[1]}</div>
              <span className="inline-block rounded-lg border border-brand-primary/35 bg-brand-primary/10 px-3 py-1.5 font-mono text-[0.8rem] text-brand-primary">
                {row.pick}
              </span>
            </div>

            <div>
              <div className={`${eyebrow} mb-1.5 md:hidden`}>{HEADINGS[2]}</div>
              <p className="m-0 text-[0.9rem] leading-6 text-text-secondary">{row.open}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
