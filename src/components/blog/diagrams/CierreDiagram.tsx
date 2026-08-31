import Image from "next/image";

const PIPELINE_IMAGE =
  "/blog/planificacion-diseno-codigo-test-deploy-qa-ia/pipeline-agentes-ia.png";

export function CierreDiagram() {
  return (
    <figure className="not-prose relative left-1/2 my-10 w-[min(96rem,calc(100vw-2rem))] max-w-none -translate-x-1/2 overflow-hidden rounded-2xl border border-[rgb(var(--outline-ghost)/0.18)] bg-[rgb(var(--surface-dim)/0.9)] p-1 shadow-[var(--shadow-ambient)] sm:p-1.5">
      <Image
        src={PIPELINE_IMAGE}
        alt="Pipeline de entrega continua asistido por agentes de IA, desde planificación hasta QA y retroalimentación"
        width={1920}
        height={1180}
        sizes="(min-width: 1568px) 1536px, calc(100vw - 32px)"
        className="block h-auto w-full rounded-xl object-contain"
      />
      <figcaption className="sr-only">
        El proceso comienza con la Planificación y una especificación
        verificable. Continúa con la Implementación mediante Claude Code y TDD;
        sigue con Testing adversarial para intentar romper la solución, y con un
        Despliegue controlado mediante el Design System y habilidades CLI.
        Finalmente, QA realiza el monitoreo en producción. Los hallazgos, las
        métricas, los errores y las señales de los usuarios generan
        retroalimentación que regresa a Planificación para crear un nuevo plan.
      </figcaption>
    </figure>
  );
}
