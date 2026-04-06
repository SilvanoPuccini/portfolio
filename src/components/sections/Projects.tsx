import { projects } from "@/lib/site";

export default function Projects() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="font-['Space_Grotesk'] text-3xl font-bold">Proyectos destacados</h2>
        <a href="/proyectos" className="text-sm text-secondary hover:text-accent">
          Ver todos →
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {projects.map((project) => (
          <article key={project.title} className="section-card p-6">
            <h3 className="mb-3 text-xl font-semibold text-slate-100">{project.title}</h3>
            <p className="mb-3 text-sm text-slate-400">
              <strong className="text-slate-200">Problema:</strong> {project.problem}
            </p>
            <p className="mb-5 text-sm text-slate-400">
              <strong className="text-slate-200">Solución:</strong> {project.solution}
            </p>
            <div className="flex gap-3 text-sm">
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-secondary/40 px-3 py-1 text-secondary hover:bg-secondary/10"
              >
                Demo
              </a>
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 px-3 py-1 text-slate-200 hover:border-secondary"
              >
                Repo
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
