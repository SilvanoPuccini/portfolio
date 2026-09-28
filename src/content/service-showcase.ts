/** Display-only provenance, never a source of package prices, scope or checkout state. */
export const WEB_SHOWCASE = {
  id: 'bruma',
  packageSlugs: ['landing'] as const,
  routes: { es: '/demo/es/bruma', en: '/demo/en/bruma' },
  concept: true,
  sourceRevision: 'dd4034ae0f9530a7716abfd4ce1d716f5c9fa15f',
  sourceLicense: '/showcase/bruma/LICENSE.txt',
  assetInventory: '/showcase/bruma/README.md',
  capabilities: ['responsive-static-content', 'in-page-navigation', 'native-faq'] as const,
  excludedCapabilities: ['reservations', 'commerce', 'payment', 'backend', 'live-contact'] as const,
} as const;
