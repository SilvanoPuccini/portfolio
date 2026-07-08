import { describe, expect, it } from 'vitest';
import { newLeadHtml } from '@/lib/email-templates/new-lead';
import { questionnaireInviteHtml } from '@/lib/email-templates/questionnaire-invite';
import { proposalReadyHtml } from '@/lib/email-templates/proposal-ready';
import { contractReadyHtml } from '@/lib/email-templates/contract-ready';

const mockLead = {
  name: 'Test Client',
  email: 'test@example.com',
  service: 'full-stack-builds',
  project_type: 'Platform',
  created_at: '2026-07-07T22:00:00Z',
};

describe('newLeadHtml', () => {
  it('returns a string', () => {
    const html = newLeadHtml(mockLead);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the lead name', () => {
    const html = newLeadHtml(mockLead);
    expect(html).toContain('Test Client');
  });

  it('contains the lead email', () => {
    const html = newLeadHtml(mockLead);
    expect(html).toContain('test@example.com');
  });

  it('contains the service', () => {
    const html = newLeadHtml(mockLead);
    expect(html).toContain('full-stack-builds');
  });

  it('contains the project type', () => {
    const html = newLeadHtml(mockLead);
    expect(html).toContain('Platform');
  });

  it('works when service is null', () => {
    const html = newLeadHtml({ ...mockLead, service: null, project_type: null });
    expect(typeof html).toBe('string');
  });
});

describe('questionnaireInviteHtml', () => {
  const url = 'https://silvanopuccini.dev/questionnaire/abc-123';

  it('returns a string', () => {
    const html = questionnaireInviteHtml({ name: 'Test Client', email: 'test@example.com' }, url);
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the client name', () => {
    const html = questionnaireInviteHtml({ name: 'Test Client', email: 'test@example.com' }, url);
    expect(html).toContain('Test Client');
  });

  it('contains the questionnaire URL', () => {
    const html = questionnaireInviteHtml({ name: 'Test Client', email: 'test@example.com' }, url);
    expect(html).toContain(url);
  });
});

describe('proposalReadyHtml', () => {
  it('returns a string', () => {
    const html = proposalReadyHtml({ name: 'Test Client', email: 'test@example.com' });
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the client name', () => {
    const html = proposalReadyHtml({ name: 'Test Client', email: 'test@example.com' });
    expect(html).toContain('Test Client');
  });
});

describe('contractReadyHtml', () => {
  it('returns a string', () => {
    const html = contractReadyHtml({ name: 'Test Client', email: 'test@example.com' });
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('contains the client name', () => {
    const html = contractReadyHtml({ name: 'Test Client', email: 'test@example.com' });
    expect(html).toContain('Test Client');
  });
});
