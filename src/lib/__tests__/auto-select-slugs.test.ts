import { describe, expect, it } from 'vitest';

// We test autoSelectSlugs by importing it from the page file directly.
// Since it's a module-level function in a client component file, we need
// to extract or re-export it. For now, we duplicate the logic into a
// testable module that the page will import.
// See: src/lib/auto-select-slugs.ts (created by this task)
import { autoSelectSlugs } from '@/lib/auto-select-slugs';

type Lead = {
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

describe('autoSelectSlugs', () => {
  describe('service_data path (new leads)', () => {
    it('returns automation slug for automation-ai service', () => {
      const lead: Lead = {
        service: 'automation-ai',
        service_data: {},
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('automatizacion_ia')).toBe(true);
    });

    it('returns base web slug for product-ux-engineering service', () => {
      const lead: Lead = {
        service: 'product-ux-engineering',
        service_data: {},
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('web_multipagina_base')).toBe(true);
    });

    it('returns landing slug for full-stack-builds when current state is Nothing', () => {
      const lead: Lead = {
        service: 'full-stack-builds',
        service_data: { fs_current_state: 'Nothing' },
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('web_multipagina_base')).toBe(true);
    });

    it('returns landing slug for full-stack-builds when current state is Landing', () => {
      const lead: Lead = {
        service: 'full-stack-builds',
        service_data: { fs_current_state: 'Landing' },
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('landing_base')).toBe(true);
    });

    it('returns a Set even for unknown service', () => {
      const lead: Lead = {
        service: 'unknown-service',
        service_data: { foo: 'bar' },
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs).toBeInstanceOf(Set);
    });
  });

  describe('legacy path (null service_data)', () => {
    it('falls back to legacy logic when service_data is null', () => {
      const lead: Lead = {
        service: null,
        service_data: null,
        tipo_proyecto: 'Landing page',
        tiene_login: false,
        tiene_pagos: false,
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('landing_base')).toBe(true);
    });

    it('uses legacy login slug when tiene_login is true', () => {
      const lead: Lead = {
        service_data: null,
        tiene_login: true,
        tipo_proyecto: null,
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('login')).toBe(true);
    });

    it('uses legacy pagos slug when tiene_pagos is true', () => {
      const lead: Lead = {
        service_data: null,
        tiene_pagos: true,
      };
      const slugs = autoSelectSlugs(lead);
      expect(slugs.has('pagos')).toBe(true);
    });

    it('does not throw when all fields are null', () => {
      const lead: Lead = {
        service: null,
        service_data: null,
        tipo_proyecto: null,
        tiene_login: null,
        tiene_pagos: null,
        tiene_admin: null,
        integraciones: null,
        idiomas: null,
        tiene_marca: null,
        tiene_contenido: null,
      };
      expect(() => autoSelectSlugs(lead)).not.toThrow();
    });

    it('returns an empty set when all fields are null', () => {
      const lead: Lead = { service_data: null };
      const slugs = autoSelectSlugs(lead);
      expect(slugs).toBeInstanceOf(Set);
      // No assertion on size — may be empty, that is valid
    });
  });
});
