import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { evaluateAssessmentAnswers } from '@/lib/recruitmentAssessment';

export async function POST(request) {
  try {
    const body = await request.json();
    const { applicationId, answers } = body;

    if (!applicationId || !answers) {
      return NextResponse.json(
        { error: 'Application ID and assessment answers are required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify application exists
    const { data: application, error: fetchErr } = await admin
      .from('applications')
      .select('id, full_name, email, app_code, status')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !application) {
      return NextResponse.json({ error: 'Application record not found.' }, { status: 404 });
    }

    // Evaluate answers
    const evaluation = evaluateAssessmentAnswers(answers);

    const updatePayload = {
      test_score: evaluation.scorePct,
      test_answers: evaluation,
      test_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If current status is applied, bump to assessed
    if (application.status === 'applied') {
      updatePayload.status = 'assessed';
    }

    const { error: updateErr } = await admin
      .from('applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (updateErr) {
      console.error('Assessment update error:', updateErr);
      return NextResponse.json(
        { error: updateErr.message || 'Failed to save assessment results.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment completed and submitted successfully.',
      scorePct: evaluation.scorePct,
      correctCount: evaluation.correctCount,
      totalScoreable: evaluation.totalScoreable,
      appCode: application.app_code
    });
  } catch (err) {
    console.error('Assessment API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
