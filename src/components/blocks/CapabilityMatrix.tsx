type CapabilityMatrixItem = {
  label: string;
  title: string;
  detail: string;
};

export default function CapabilityMatrix({
  eyebrow,
  title,
  intro,
  items,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  items: readonly CapabilityMatrixItem[];
}) {
  return (
    <article className="surface-panel no-line-stack px-6 py-7 sm:px-7">
      <div>
        <p className="technical-label">{eyebrow}</p>
        <h3 className="mt-4 section-title-sm">{title}</h3>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{intro}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={`${item.label}-${item.title}`} className="surface-subpanel px-5 py-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
            <p className="mt-3 text-lg font-semibold text-text-primary">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base sm:leading-7">{item.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
