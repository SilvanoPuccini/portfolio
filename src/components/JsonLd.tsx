export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Replace </script> with <\/script> to prevent injection via JSON values
  const json = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
