import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Search term is required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Try matching by exact app_code (case insensitive), email, or phone
    const { data: apps, error } = await admin
      .from('applications')
      .select('id, app_code, full_name, email, phone, position, status, test_score, test_completed_at, agent_id, created_at')
      .or(`app_code.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Status lookup error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!apps || apps.length === 0) {
      return NextResponse.json(
        { error: 'No application found with that reference code, email, or phone.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application: apps[0] });
  } catch (err) {
    console.error('Careers status error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
