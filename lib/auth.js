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

  const cleanEmail = user.email.toLowerCase().trim();

  // 1. Check if owner/director (case-insensitive)
  const { data: owner } = await admin
    .from('owners')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (owner && ['director', 'shareholder', 'investor'].includes(owner.role)) {
    return { user, role: 'director', profile: owner };
  }

  // 2. Check if active sales agent (case-insensitive)
  const { data: agent } = await admin
    .from('agents')
    .select('*, entities(id, code, name, commission_rate)')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (agent) {
    return { user, role: 'agent', profile: agent };
  }

  // 3. Auto-bootstrap founder: if owners table has 0 records,
  // make the first authenticated user the founding director!
  const { count, error: countErr } = await admin
    .from('owners')
    .select('*', { count: 'exact', head: true });

  if (!countErr && (count === 0 || count === null)) {
    const rawName = user.user_metadata?.full_name || cleanEmail.split('@')[0];
    const fullName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const { data: newDirector, error: insertErr } = await admin
      .from('owners')
      .insert({
        full_name: fullName,
        email: cleanEmail,
        role: 'director',
        ownership_pct: 100,
      })
      .select()
      .single();

    if (!insertErr && newDirector) {
      return { user, role: 'director', profile: newDirector };
    }
  }

  return { user, role: 'guest', profile: null };
}
