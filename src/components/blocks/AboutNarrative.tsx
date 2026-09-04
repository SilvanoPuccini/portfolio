type FactItem = {
  label: string;
  value: string;
  detail: string;
};

export default function AboutNarrative({
  title,
  intro,
  paragraphs,
  facts,
  strengthsLabel,
  strengths,
}: {
  title: string;
  intro: string;
  paragraphs: string[];
  facts: FactItem[];
  strengthsLabel: string;
  strengths: string[];
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <article className="surface-panel no-line-stack px-6 py-7 sm:px-7">
        <div>
          <p className="technical-label">Editorial profile</p>
          <h2 className="mt-4 section-title">{title}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{intro}</p>
        </div>

        <div className="space-y-4 text-sm leading-7 text-text-secondary sm:text-base">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="space-y-5">
        <article className="surface-panel px-6 py-7 sm:px-7">
          <div className="grid gap-5">
            {facts.map((fact) => (
              <div key={`${fact.label}-${fact.value}`} className="border-b border-outline-ghost/10 pb-5 last:border-b-0 last:pb-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{fact.label}</p>
                <p className="mt-2 text-lg font-semibold text-text-primary">{fact.value}</p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{fact.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel no-line-stack px-6 py-7 sm:px-7">
          <div>
            <p className="technical-label">{strengthsLabel}</p>
          </div>

          <ul className="space-y-3 text-sm leading-6 text-text-secondary sm:text-base">
            {strengths.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
