type SpecSheetItem = {
  label: string;
  value: string;
};

export default function SpecSheet({
  eyebrow,
  title,
  items,
  stack,
}: {
  eyebrow: string;
  title: string;
  items: SpecSheetItem[];
  stack: string[];
}) {
  return (
    <aside className="surface-panel no-line-stack px-6 py-6 sm:px-7 sm:py-7">
      <div>
        <p className="technical-label">{eyebrow}</p>
        <h3 className="mt-4 card-title">{title}</h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="surface-subpanel px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
            <p className="mt-3 text-base font-medium leading-7 text-text-primary">{item.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="technical-label">Stack</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {stack.map((item) => (
            <span
              key={item}
              className="rounded-pill border border-outline-ghost/15 bg-surface-elevated/80 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
