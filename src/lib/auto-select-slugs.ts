// autoSelectSlugs — determines which budget calculator modules to pre-select
// based on the lead's service_data (new leads) or legacy form fields (existing leads).

type LeadForAutoSelect = {
  service?: string | null;
  service_data?: Record<string, unknown> | null;
  tipo_proyecto?: string | null;
  tiene_login?: boolean | null;
  tiene_pagos?: boolean | null;
  tiene_admin?: string | null;
  integraciones?: string[] | null;
  idiomas?: number | null;
  tiene_marca?: boolean | null;
  tiene_contenido?: boolean | null;
};

// Legacy BASE_MAP: maps tipo_proyecto string to a base module slug
const LEGACY_BASE_MAP: Record<string, string> = {
  'Landing page': 'landing_base',
  'E-commerce': 'ecommerce_base',
  'Plataforma': 'saas_base',
  'Platform': 'saas_base',
  'Sistema interno': 'web_multipagina_base',
  'Internal system': 'web_multipagina_base',
};

// SERVICE_SLUG_MAP: maps service slug to a function that derives module slugs from service_data
const SERVICE_SLUG_MAP: Record<string, (data: Record<string, unknown>) => string[]> = {
  'full-stack-builds': (data) => {
    const slugs: string[] = [];
    const state = data.fs_current_state as string | undefined;
    if (state === 'Landing') {
      slugs.push('landing_base');
    } else {
      // Nothing, existing web app, or other — default to multi-page base
      slugs.push('web_multipagina_base');
    }
    return slugs;
  },
  'automation-ai': () => ['automatizacion_ia'],
  'product-ux-engineering': () => ['web_multipagina_base'],
};

export function autoSelectSlugs(lead: LeadForAutoSelect): Set<string> {
  const slugs = new Set<string>();

  // New path: use service_data when available
  if (lead.service_data !== null && lead.service_data !== undefined && lead.service !== null && lead.service !== undefined) {
    const mapper = SERVICE_SLUG_MAP[lead.service];
    if (mapper) {
      for (const slug of mapper(lead.service_data)) {
        slugs.add(slug);
      }
    }
    return slugs;
  }

  // Legacy path: derive slugs from individual boolean/string fields
  if (lead.tipo_proyecto && LEGACY_BASE_MAP[lead.tipo_proyecto]) {
    slugs.add(LEGACY_BASE_MAP[lead.tipo_proyecto]);
  }
  if (lead.tiene_login === true) slugs.add('login');
  if (lead.tiene_pagos === true) slugs.add('pagos');
  if (lead.tiene_admin === 'yes') slugs.add('admin_panel');
  if (lead.integraciones && lead.integraciones.length > 0) slugs.add('integracion_externa');
  if (lead.idiomas && lead.idiomas > 1) slugs.add('i18n');
  if (lead.tiene_marca === false) slugs.add('diseno_desde_cero');
  if (lead.tiene_contenido === false) slugs.add('contenido');

  return slugs;
}
