import JsonLd from "@/components/JsonLd";

type Props = {
  siteUrl: string;
};

/**
 * Server Component — renders schema.org ContactPoint JSON-LD.
 * Passes validation in Google Rich Results Test.
 */
export default function ContactPointJsonLd({ siteUrl }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Silvano Puccini",
    url: siteUrl,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: `${siteUrl}/es/contact`,
      availableLanguage: ["Spanish", "English"],
    },
  };

  return <JsonLd data={data} />;
}
