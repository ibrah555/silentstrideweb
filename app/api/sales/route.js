import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const form = await request.formData();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('sales').insert({
    entity_id: form.get('entity_id'),
    agent_id: form.get('agent_id') || null,
    batch_label: form.get('batch_label') || null,
    total_amount: Number(form.get('total_amount')),
    cogs_amount: Number(form.get('cogs_amount') || 0),
  });

  if (error) return NextResponse.redirect(new URL('/sales?error=' + encodeURIComponent(error.message), request.url));
  return NextResponse.redirect(new URL('/sales?ok=1', request.url));
}
