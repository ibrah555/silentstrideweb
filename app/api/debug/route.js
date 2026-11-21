import { createClient as createServerClient } from '@/lib/supabase';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return 'invalid-token-structure';
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    const parsed = JSON.parse(payload);
    return {
      role: parsed.role,
      iss: parsed.iss,
      exp: parsed.exp ? new Date(parsed.exp * 1000).toISOString() : null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    const admin = createAdminClient(supabaseUrl, serviceKey);

    const { data: owners, error: ownersErr } = await admin.from('owners').select('id, full_name, email, role');
    const { data: agents, error: agentsErr } = await admin.from('agents').select('*').limit(1);
    const { data: entities, error: entitiesErr } = await admin.from('entities').select('id, code, name');

    // Also test a raw query if possible or check error details
    return NextResponse.json({
      auth: {
        loggedIn: !!user,
        email: user?.email || null,
        id: user?.id || null,
        error: authErr?.message || null,
      },
      tokens: {
        serviceRoleJwt: decodeJwtPayload(serviceKey),
        anonJwt: decodeJwtPayload(anonKey),
      },
      tables: {
        owners: ownersErr ? { error: ownersErr.message, code: ownersErr.code, details: ownersErr.details, hint: ownersErr.hint } : owners,
        agents: agentsErr ? { error: agentsErr.message, code: agentsErr.code } : agents,
        entities: entitiesErr ? { error: entitiesErr.message, code: entitiesErr.code } : entities,
      },
      env: {
        hasUrl: !!supabaseUrl,
        urlDomain: supabaseUrl ? new URL(supabaseUrl).hostname : null,
        hasAnon: !!anonKey,
        hasService: !!serviceKey,
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
