import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/050_managed_care_runtime_guards.sql'), 'utf8');
const generations = readFileSync(join(process.cwd(), 'supabase/migrations/051_managed_care_agreement_generations.sql'), 'utf8');

it('qualifies the period order column instead of the PL/pgSQL ordinal variable', () => {
  expect(migration).toContain('ORDER BY public.care_periods.ordinal DESC');
  expect(migration).not.toMatch(/ORDER BY ordinal DESC/);
});

it('does not create retroactive or unpaid renewal periods', () => {
  expect(migration).toContain('period.ends_on<>today OR period.paid_at IS NULL');
  expect(migration).toContain("RAISE EXCEPTION 'renewal_not_due'");
});

it('archives the previous agreement and separates new payments, requests, and periods by generation', () => {
  expect(generations).toContain('INSERT INTO public.care_agreement_history(order_id,generation,subscription)');
  expect(generations).toContain('NEW.generation IS DISTINCT FROM current_generation');
  expect(generations).toContain("RAISE EXCEPTION 'archived_care_immutable'");
  expect(generations).toContain("IF TG_OP='UPDATE' THEN RETURN NEW; END IF;");
  expect(generations).toContain("r.status IN ('pending','included','warranty')");
  expect(generations).toContain("THEN RAISE EXCEPTION 'source_request_pending'");
  expect(generations).toContain('period.ends_on>=today');
  expect(generations).toContain('AND generation=sub.generation FOR UPDATE');
  expect(generations).toContain('AND generation=sub.generation AND starts_on<=today');
  expect(generations).toContain('INSERT INTO public.care_events(order_id,request_id,actor,command,generation)');
});
