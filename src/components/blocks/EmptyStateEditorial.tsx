export default function EmptyStateEditorial({
  message,
  note,
}: {
  message: string;
  note: string;
}) {
  return (
    <div className="surface-panel bg-editorial-texture no-line-stack px-7 py-10 sm:px-10 sm:py-12">
      <p className="technical-label">Editorial state</p>
      <h3 className="max-w-2xl text-3xl text-text-primary sm:text-4xl">{message}</h3>
      <p className="max-w-2xl text-base leading-7 text-text-secondary sm:text-lg sm:leading-8">{note}</p>
    </div>
  );
}
