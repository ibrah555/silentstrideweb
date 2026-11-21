import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const form = await request.formData();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const entityId = form.get('entity_id');
  const amount = Number(form.get('amount'));
  const account = form.get('account') || 'opex';
  const memo = form.get('memo') || 'Expense';

  // 1. Record expense
  const { data: exp, error } = await supabase.from('expenses').insert({
    entity_id: entityId, account, amount, memo,
    spent_at: form.get('spent_at') || new Date().toISOString().slice(0, 10),
  }).select().single();

  if (error) return NextResponse.redirect(new URL('/expenses?error=' + encodeURIComponent(error.message), request.url));

  // 2. Ledger: expense (debit) / cash (credit)
  await supabase.from('ledger_entries').insert([
    { entity_id: entityId, account, debit: amount, memo, ref_type: 'expense', ref_id: exp.id },
    { entity_id: entityId, account: 'cash', credit: amount, memo, ref_type: 'expense', ref_id: exp.id },
  ]);

  return NextResponse.redirect(new URL('/expenses?ok=1', request.url));
}
