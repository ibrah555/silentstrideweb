import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const form = await request.formData();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const agentId = form.get('agent_id');
  const amount = Number(form.get('amount'));
  const saleId = form.get('sale_id') || null;

  // Verify agent exists and has enough payable
  const { data: agent } = await supabase.from('agents').select('*, entities(id)').eq('id', agentId).single();
  if (!agent) return NextResponse.redirect(new URL('/agents?error=agent_not_found', request.url));

  const { data: balance } = await supabase.from('v_agent_balances').select('payable').eq('id', agentId).single();
  if (!balance || Number(balance.payable) < amount) {
    return NextResponse.redirect(new URL('/agents?error=insufficient_payable', request.url));
  }

  // Record payment
  const { error } = await supabase.from('commission_payments').insert({
    agent_id: agentId, sale_id: saleId, amount,
  });
  if (error) return NextResponse.redirect(new URL('/agents?error=' + encodeURIComponent(error.message), request.url));

  // Ledger entries are auto-created by DB trigger (trg_comm_payment_ledger)

  return NextResponse.redirect(new URL('/agents?ok=paid', request.url));
}
