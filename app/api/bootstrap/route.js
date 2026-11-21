import { createClient as createServerClient } from '@/lib/supabase';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST /api/bootstrap — Makes the currently logged-in user a director
// ONLY works if there are ZERO directors in the system
export async function POST(request) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    const baseUrl = new URL('/', request.url).origin;

    if (!user || !user.email) {
      return NextResponse.redirect(baseUrl + '/login?error=' + encodeURIComponent('You must be logged in first.'));
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if any directors already exist
    const { data: existingDirectors } = await admin
      .from('owners')
      .select('id')
      .in('role', ['director', 'shareholder', 'investor']);

    if (existingDirectors && existingDirectors.length > 0) {
      return NextResponse.redirect(baseUrl + '/?error=' + encodeURIComponent('A director already exists. This endpoint is only for initial setup.'));
    }

    // Insert current user as the first director
    const { data: newOwner, error: insertErr } = await admin
      .from('owners')
      .insert({
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        email: user.email.toLowerCase(),
        role: 'director',
        ownership_pct: 100,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.redirect(baseUrl + '/?error=' + encodeURIComponent(insertErr.message));
    }

    // Success — redirect to dashboard
    return NextResponse.redirect(baseUrl + '/dashboard');
  } catch (err) {
    const baseUrl = new URL('/', request.url).origin;
    return NextResponse.redirect(baseUrl + '/?error=' + encodeURIComponent(err.message));
  }
}
