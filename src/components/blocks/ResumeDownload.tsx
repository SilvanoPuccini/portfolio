import CTACluster from "@/components/site/CTACluster";

type ResumeMetaItem = {
  label: string;
  value: string;
};

export default function ResumeDownload({
  anchorId,
  eyebrow,
  title,
  description,
  helper,
  meta,
  downloadLabel,
  downloadHref,
  contactLabel,
  contactHref,
}: {
  anchorId: string;
  eyebrow: string;
  title: string;
  description: string;
  helper: string;
  meta: ResumeMetaItem[];
  downloadLabel: string;
  downloadHref: string;
  contactLabel: string;
  contactHref: string;
}) {
  return (
    <section id={anchorId} className="site-container pb-10 sm:pb-12 lg:pb-14 scroll-mt-28">
      <div className="surface-section bg-editorial-texture relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(138,235,255,0.12),transparent_34%),radial-gradient(circle_at_85%_24%,rgba(5,102,217,0.16),transparent_28%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] xl:items-end xl:gap-12">
          <div className="no-line-stack max-w-3xl">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 className="mt-4 text-4xl text-text-primary sm:text-5xl">{title}</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">
                {description}
              </p>
            </div>

            <CTACluster
              items={[
                { label: downloadLabel, href: downloadHref },
                { label: contactLabel, href: contactHref, variant: "secondary" },
              ]}
            />

            <p className="max-w-2xl text-sm leading-6 text-text-secondary">{helper}</p>
          </div>

          <aside className="surface-panel px-6 py-6 sm:px-7">
            <div className="space-y-4">
              {meta.map((item) => (
                <div key={`${item.label}-${item.value}`} className="border-b border-outline-ghost/10 pb-4 last:border-b-0 last:pb-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-tertiary">{item.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-text-primary sm:text-base">{item.value}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
