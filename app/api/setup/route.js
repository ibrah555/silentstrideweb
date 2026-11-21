import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST /api/setup — action=add_owner | add_agent | add_subsidiary | add_capital
export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const back = (msg) => NextResponse.redirect(new URL('/setup?' + msg, request.url));

  if (action === 'add_owner') {
    const { error } = await supabase.from('owners').insert({
      full_name: form.get('full_name'),
      email: form.get('email'),
      role: form.get('role') || 'director',
      ownership_pct: Number(form.get('ownership_pct')),
    });
    return back(error ? 'error=' + encodeURIComponent(error.message) : 'ok=owner_added');
  }

  if (action === 'add_agent') {
    const { error } = await supabase.from('agents').insert({
      entity_id: form.get('entity_id'),
      full_name: form.get('full_name'),
      phone: form.get('phone'),
      email: form.get('email'),
      commission_rate: Number(form.get('commission_rate') || 0.10),
      status: form.get('status') || 'pending',
      agreement_signed_at: form.get('agreement_signed') ? new Date().toISOString() : null,
    });
    return back(error ? 'error=' + encodeURIComponent(error.message) : 'ok=agent_added');
  }

  if (action === 'add_subsidiary') {
    const { error } = await supabase.from('entities').insert({
      code: form.get('code'),
      name: form.get('name'),
      kind: 'subsidiary',
      status: form.get('status') || 'planned',
      commission_rate: Number(form.get('commission_rate') || 0.10),
    });
    return back(error ? 'error=' + encodeURIComponent(error.message) : 'ok=subsidiary_added');
  }

  if (action === 'add_capital') {
    const { error } = await supabase.from('capital_contributions').insert({
      owner_id: form.get('owner_id'),
      entity_id: form.get('entity_id'),
      amount: Number(form.get('amount')),
      tranche_label: form.get('tranche_label'),
      contributed_at: form.get('contributed_at') || new Date().toISOString().slice(0, 10),
    });
    if (error) return back('error=' + encodeURIComponent(error.message));

    // Ledger: cash (debit) / capital (credit)
    const { data: owner } = await supabase.from('owners').select('full_name').eq('id', form.get('owner_id')).single();
    const amount = Number(form.get('amount'));
    const memo = `Capital — ${owner?.full_name || 'Owner'} (${form.get('tranche_label') || 'contribution'})`;
    await supabase.from('ledger_entries').insert([
      { entity_id: form.get('entity_id'), account: 'cash', debit: amount, memo, ref_type: 'capital' },
      { entity_id: form.get('entity_id'), account: 'capital', credit: amount, memo, ref_type: 'capital' },
    ]);
    return back('ok=capital_added');
  }

  return back('error=unknown_action');
}
