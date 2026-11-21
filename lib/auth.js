import { createClient as createServerClient } from '@/lib/supabase';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Resolves the logged-in user and whether they are a Director or an Agent
export async function getCurrentUserRole() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  // Use admin client to reliably check role without RLS circular blocks
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Check if owner/director
  const { data: owner } = await admin
    .from('owners')
    .select('*')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (owner && ['director', 'shareholder', 'investor'].includes(owner.role)) {
    return { user, role: 'director', profile: owner };
  }

  // 2. Check if active sales agent
  const { data: agent } = await admin
    .from('agents')
    .select('*, entities(id, code, name, commission_rate)')
    .eq('email', user.email.toLowerCase())
    .maybeSingle();

  if (agent) {
    return { user, role: 'agent', profile: agent };
  }

  return { user, role: 'guest', profile: null };
}
