type TimelineItem = {
  title: string;
  context: string;
  detail: string;
};

export default function TimelineList({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: TimelineItem[];
}) {
  return (
    <article className="surface-panel px-6 py-7 sm:px-7">
      <div>
        <p className="technical-label">{eyebrow}</p>
        <h3 className="mt-4 text-2xl text-text-primary sm:text-3xl">{title}</h3>
      </div>

      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <div key={`${item.title}-${item.context}`} className="border-b border-outline-ghost/10 pb-5 last:border-b-0 last:pb-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.context}</p>
            <p className="mt-3 text-lg font-semibold text-text-primary">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">{item.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
