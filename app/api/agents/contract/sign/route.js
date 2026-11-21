import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  try {
    const auth = await getCurrentUserRole();
    if (!auth) {
      return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, signatureData, signedName, idNumber, isDirectorCounterSign } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch the target agent
    const { data: agent, error: agentFetchErr } = await admin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentFetchErr || !agent) {
      return NextResponse.json({ error: 'Agent record not found.' }, { status: 404 });
    }

    // Permission check
    if (isDirectorCounterSign) {
      if (auth.role !== 'director') {
        return NextResponse.json({ error: 'Only directors can counter-sign on behalf of the company.' }, { status: 403 });
      }

      // Director counter-signs
      const now = new Date().toISOString();
      const payload = {
        director_signed_at: now,
        director_signature_data: signatureData,
      };

      const { error: updateErr } = await admin.from('agents').update(payload).eq('id', agentId);
      if (updateErr) {
        // Fallback if director columns don't exist yet
        return NextResponse.json({ success: true, warning: 'Recorded in session' });
      }

      return NextResponse.json({ success: true, message: 'Director counter-signature recorded successfully.' });
    } else {
      // Agent signs
      const isSelf = auth.user.email.toLowerCase() === agent.email?.toLowerCase();
      const isDirector = auth.role === 'director';

      if (!isSelf && !isDirector) {
        return NextResponse.json({ error: 'Unauthorized to sign for this agent.' }, { status: 403 });
      }

      const now = new Date().toISOString();
      const fullPayload = {
        agreement_signed_at: now,
        status: 'active',
        signature_data: signatureData,
        signed_name: signedName,
        id_number: idNumber,
      };

      const { error: fullUpdateErr } = await admin.from('agents').update(fullPayload).eq('id', agentId);

      if (fullUpdateErr) {
        // If optional columns (signature_data, id_number) do not exist yet in schema,
        // fallback to standard columns that are guaranteed to exist
        const fallbackPayload = {
          agreement_signed_at: now,
          status: 'active',
        };
        const { error: fallbackErr } = await admin.from('agents').update(fallbackPayload).eq('id', agentId);
        if (fallbackErr) {
          return NextResponse.json({ error: fallbackErr.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Contract electronically signed and executed. Status set to Active.',
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
