import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const auth = await getCurrentUserRole();

  if (!auth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let entityId = form.get('entity_id');
  let agentId = form.get('agent_id') || null;
  let cogsAmount = Number(form.get('cogs_amount') || 0);
  const totalAmount = Number(form.get('total_amount'));
  const batchLabel = form.get('batch_label') || null;
  const isPortal = auth.role === 'agent' || form.get('source') === 'portal';

  // If agent is submitting: force agent_id and entity_id to match their verified identity
  if (auth.role === 'agent') {
    agentId = auth.profile.id;
    entityId = auth.profile.entity_id;
    cogsAmount = 0; // Cost of goods handled by management
  }

  const redirectUrl = (params) => {
    const target = isPortal ? '/portal' : '/sales';
    return NextResponse.redirect(new URL(`${target}?${params}`, request.url));
  };

  if (!entityId || !totalAmount || totalAmount <= 0) {
    return redirectUrl('error=' + encodeURIComponent('Invalid sale amount or entity'));
  }

  const { error } = await supabase.from('sales').insert({
    entity_id: entityId,
    agent_id: agentId,
    batch_label: batchLabel,
    total_amount: totalAmount,
    cogs_amount: cogsAmount,
  });

  if (error) {
    return redirectUrl('error=' + encodeURIComponent(error.message));
  }

  return redirectUrl('ok=1');
}
