import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthorized } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export type CrmStats = {
  total_leads: number;
  leads_to_call_rate: number;
  call_to_proposal_rate: number;
  proposal_to_close_rate: number;
  pipeline_value: number;
  avg_deal_value: number;
  monthly_trends: { month: string; lead_count: number; closed_count: number }[];
};

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Funnel counts by estado
    const { data: funnelData, error: funnelError } = await supabase
      .from('leads')
      .select('estado, monto_presupuestado, proposal_sent_at');

    if (funnelError) throw funnelError;

    const leads = funnelData ?? [];
    const total_leads = leads.length;

    // Funnel stages
    const calledStages = new Set(['llamada_agendada', 'en conversación', 'presupuestado', 'cerrado']);
    const proposalStages = new Set(['presupuestado', 'cerrado']);

    const calledCount = leads.filter((l) => calledStages.has(l.estado)).length;
    const proposalCount = leads.filter(
      (l) => proposalStages.has(l.estado) || l.proposal_sent_at != null,
    ).length;
    const closedCount = leads.filter((l) => l.estado === 'cerrado').length;

    // Conversion rates (guard against division by zero)
    const leads_to_call_rate = total_leads > 0
      ? Math.round((calledCount / total_leads) * 100)
      : 0;
    const call_to_proposal_rate = calledCount > 0
      ? Math.round((proposalCount / calledCount) * 100)
      : 0;
    const proposal_to_close_rate = proposalCount > 0
      ? Math.round((closedCount / proposalCount) * 100)
      : 0;

    // Revenue KPIs (only closed leads with budget)
    const closedWithBudget = leads
      .filter((l) => l.estado === 'cerrado' && l.monto_presupuestado != null)
      .map((l) => l.monto_presupuestado as number);

    const pipeline_value = leads
      .filter((l) => l.estado !== 'cerrado' && l.estado !== 'descartado' && l.monto_presupuestado != null)
      .reduce((sum, l) => sum + (l.monto_presupuestado as number), 0);

    const avg_deal_value = closedWithBudget.length > 0
      ? Math.round(closedWithBudget.reduce((s, v) => s + v, 0) / closedWithBudget.length)
      : 0;

    // Monthly trends: last 12 months
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('leads')
      .select('created_at, estado')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    if (monthlyError) throw monthlyError;

    const monthlyMap: Record<string, { lead_count: number; closed_count: number }> = {};
    for (const lead of monthlyData ?? []) {
      const month = lead.created_at.slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { lead_count: 0, closed_count: 0 };
      monthlyMap[month].lead_count += 1;
      if (lead.estado === 'cerrado') monthlyMap[month].closed_count += 1;
    }

    const monthly_trends = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({ month, ...counts }));

    const stats: CrmStats = {
      total_leads,
      leads_to_call_rate,
      call_to_proposal_rate,
      proposal_to_close_rate,
      pipeline_value,
      avg_deal_value,
      monthly_trends,
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[admin/crm-stats] GET error:', err);
    return NextResponse.json({ error: 'Error loading CRM stats.' }, { status: 500 });
  }
}
