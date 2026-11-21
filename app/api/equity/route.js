import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const back = (msg) => NextResponse.redirect(new URL('/equity?' + msg, request.url));

  const auth = await getCurrentUserRole();
  if (!auth || auth.role !== 'director') {
    return back('error=' + encodeURIComponent('Unauthorized. Only directors can record capital.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // RECORD CAPITAL
  if (action === 'add_capital') {
    const ownerId = form.get('owner_id');
    const entityId = form.get('entity_id');
    const amount = Number(form.get('amount'));
    const trancheLabel = form.get('tranche_label') || 'Capital Injection';
    const contributedAt = form.get('contributed_at') || new Date().toISOString().slice(0, 10);

    if (!ownerId || !entityId || !amount || amount <= 0) {
      return back('error=' + encodeURIComponent('Please enter a valid owner, subsidiary, and positive amount.'));
    }

    // 1. Insert capital contribution
    const { data: contrib, error: contribError } = await supabase.from('capital_contributions').insert({
      owner_id: ownerId,
      entity_id: entityId,
      amount,
      tranche_label: trancheLabel,
      contributed_at: contributedAt,
    }).select().single();

    if (contribError) return back('error=' + encodeURIComponent(contribError.message));

    // 2. Double-entry ledger: Cash (debit) / Capital (credit)
    const { data: owner } = await supabase.from('owners').select('full_name').eq('id', ownerId).single();
    const memo = `Capital — ${owner?.full_name || 'Director'} (${trancheLabel})`;

    await supabase.from('ledger_entries').insert([
      { entity_id: entityId, account: 'cash', debit: amount, memo, ref_type: 'capital', ref_id: contrib.id },
      { entity_id: entityId, account: 'capital', credit: amount, memo, ref_type: 'capital', ref_id: contrib.id },
    ]);

    return back('ok=' + encodeURIComponent(`Capital contribution of $${amount.toLocaleString()} recorded and posted to ledger.`));
  }

  // DELETE / UNDO CAPITAL ENTRY
  if (action === 'delete_capital') {
    const id = form.get('id');

    // 1. Remove ledger entries linked to this contribution
    await supabase.from('ledger_entries').delete().eq('ref_id', id);

    // 2. Remove contribution
    const { error } = await supabase.from('capital_contributions').delete().eq('id', id);
    if (error) return back('error=' + encodeURIComponent(error.message));

    return back('ok=' + encodeURIComponent('Capital contribution and matching ledger entries reversed.'));
  }

  return back('error=unknown_action');
}
