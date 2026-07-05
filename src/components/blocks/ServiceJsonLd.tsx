import JsonLd from "@/components/JsonLd";

type ServiceSchema = {
  name: string;
  description: string;
  url: string;
};

type Props = {
  services: ServiceSchema[];
  providerName: string;
  providerUrl: string;
};

/**
 * Server Component — renders schema.org Service JSON-LD for each service.
 * Passes validation in Google Rich Results Test.
 */
export default function ServiceJsonLd({ services, providerName, providerUrl }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        url: service.url,
        provider: {
          "@type": "Person",
          name: providerName,
          url: providerUrl,
        },
      },
    })),
  };

  return <JsonLd data={data} />;
}
