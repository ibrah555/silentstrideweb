import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const back = (msg) => NextResponse.redirect(new URL('/subsidiaries?' + msg, request.url));

  const auth = await getCurrentUserRole();
  if (!auth || auth.role !== 'director') {
    return back('error=' + encodeURIComponent('Unauthorized. Only directors can manage subsidiaries.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // CREATE SUBSIDIARY
  if (action === 'create') {
    const code = form.get('code')?.trim().toUpperCase();
    const name = form.get('name')?.trim();
    const status = form.get('status') || 'active';
    const commissionRate = Number(form.get('commission_rate') || 0.10);

    if (!code || !name) {
      return back('error=' + encodeURIComponent('Code and Name are required.'));
    }

    const { error } = await supabase.from('entities').insert({
      code,
      name,
      kind: 'subsidiary',
      status,
      commission_rate: commissionRate,
    });

    if (error) return back('error=' + encodeURIComponent(error.message));
    return back('ok=' + encodeURIComponent(`Subsidiary ${name} (${code}) added successfully.`));
  }

  // UPDATE SUBSIDIARY
  if (action === 'update') {
    const id = form.get('id');
    const name = form.get('name')?.trim();
    const status = form.get('status');
    const commissionRate = Number(form.get('commission_rate'));

    const { error } = await supabase.from('entities').update({
      name,
      status,
      commission_rate: commissionRate,
    }).eq('id', id);

    if (error) return back('error=' + encodeURIComponent(error.message));
    return back('ok=' + encodeURIComponent(`Subsidiary updated successfully.`));
  }

  // DELETE SUBSIDIARY
  if (action === 'delete') {
    const id = form.get('id');
    const { error } = await supabase.from('entities').delete().eq('id', id);
    if (error) return back('error=' + encodeURIComponent('Cannot delete entity with existing sales/ledger records. Set status to dormant instead.'));
    return back('ok=' + encodeURIComponent('Subsidiary removed.'));
  }

  return back('error=unknown_action');
}
