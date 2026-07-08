import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: questionnaire, error } = await supabase
      .from('questionnaires')
      .select('id, completed_at')
      .eq('token', token)
      .single();

    if (error || !questionnaire) {
      return NextResponse.json({ error: 'Questionnaire not found.' }, { status: 404 });
    }

    return NextResponse.json({
      completed: questionnaire.completed_at != null,
    });
  } catch (err) {
    console.error('[api/questionnaire/check] GET error:', err);
    return NextResponse.json({ error: 'Error checking questionnaire.' }, { status: 500 });
  }
}
