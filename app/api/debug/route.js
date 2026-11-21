import { createClient as createServerClient } from '@/lib/supabase';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Check if user is logged in
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    // 2. Use admin client to check tables
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: owners, error: ownersErr } = await admin.from('owners').select('id, full_name, email, role');
    const { data: agents, error: agentsErr } = await admin.from('agents').select('id, full_name, email');
    const { data: entities, error: entitiesErr } = await admin.from('entities').select('id, code, name');

    return NextResponse.json({
      auth: {
        loggedIn: !!user,
        email: user?.email || null,
        id: user?.id || null,
        error: authErr?.message || null,
      },
      owners: ownersErr ? { error: ownersErr.message } : owners,
      agents: agentsErr ? { error: agentsErr.message } : agents,
      entities: entitiesErr ? { error: entitiesErr.message } : entities,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
