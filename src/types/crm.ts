export type Questionnaire = {
  id: string;
  lead_id: string;
  token: string;
  answers: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
};

export type LeadCrmExtension = {
  service: string | null;
  service_data: Record<string, unknown> | null;
  diagnostico_dolor: string | null;
  diagnostico_deseo: string | null;
  diagnostico_preocupaciones: string | null;
  proposal_sent_at: string | null;
  contract_sent_at: string | null;
};
