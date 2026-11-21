import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  try {
    const auth = await getCurrentUserRole();
    if (!auth || auth.role !== 'director') {
      return NextResponse.json(
        { error: 'Unauthorized. Only directors can review and onboard applicants.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, applicationId, status, notes, commissionRate, entityId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch the applicant
    const { data: application, error: fetchErr } = await admin
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !application) {
      return NextResponse.json({ error: 'Application record not found.' }, { status: 404 });
    }

    // Handle action
    if (action === 'save_notes') {
      const { error: notesErr } = await admin
        .from('applications')
        .update({ interview_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (notesErr) {
        return NextResponse.json({ error: notesErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Interview notes updated.' });
    }

    if (action === 'update_status') {
      if (!status) {
        return NextResponse.json({ error: 'New status is required.' }, { status: 400 });
      }

      const { error: statusErr } = await admin
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (statusErr) {
        return NextResponse.json({ error: statusErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `Status updated to ${status}.` });
    }

    if (action === 'onboard_agent') {
      const targetEntityId = entityId || application.entity_id;
      if (!targetEntityId) {
        return NextResponse.json(
          { error: 'A subsidiary entity must be selected for this agent.' },
          { status: 400 }
        );
      }

      const rate = commissionRate !== undefined ? Number(commissionRate) : 0.10;

      // Check if an agent already exists with this email
      let agentId = application.agent_id;

      if (!agentId) {
        const { data: existingAgent } = await admin
          .from('agents')
          .select('id')
          .eq('email', application.email.toLowerCase())
          .limit(1);

        if (existingAgent && existingAgent.length > 0) {
          agentId = existingAgent[0].id;
        } else {
          // Insert new agent
          const { data: newAgent, error: createAgentErr } = await admin
            .from('agents')
            .insert({
              entity_id: targetEntityId,
              full_name: application.full_name,
              phone: application.phone,
              email: application.email.toLowerCase(),
              id_number: application.id_number || null,
              commission_rate: rate,
              status: 'pending'
            })
            .select()
            .single();

          if (createAgentErr) {
            console.error('Create agent error:', createAgentErr);
            return NextResponse.json(
              { error: createAgentErr.message || 'Failed to create agent record.' },
              { status: 500 }
            );
          }
          agentId = newAgent.id;
        }
      }

      // Update application to hired
      await admin
        .from('applications')
        .update({
          status: 'hired',
          agent_id: agentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      return NextResponse.json({
        success: true,
        message: 'Applicant officially onboarded! Agency contract is ready for signature.',
        agentId,
        contractUrl: `/contract/${agentId}`
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (err) {
    console.error('Recruitment action error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
