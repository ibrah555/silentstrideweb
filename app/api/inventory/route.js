import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// POST /api/inventory — action=add_item | action=stock_in | action=adjust
export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (action === 'add_item') {
    const { error } = await supabase.from('inventory_items').insert({
      entity_id: form.get('entity_id'),
      sku: form.get('sku'),
      name: form.get('name'),
      unit_cost: Number(form.get('unit_cost')),
      unit_price: Number(form.get('unit_price')),
      qty_on_hand: 0,
    });
    if (error) return NextResponse.redirect(new URL('/inventory?error=' + encodeURIComponent(error.message), request.url));
    return NextResponse.redirect(new URL('/inventory?ok=item_added', request.url));
  }

  if (action === 'stock_in') {
    const itemId = form.get('item_id');
    const qty = Number(form.get('qty'));
    const unitCost = Number(form.get('unit_cost'));

    const { data: item, error: fetchErr } = await supabase
      .from('inventory_items').select('*').eq('id', itemId).single();
    if (fetchErr || !item) return NextResponse.redirect(new URL('/inventory?error=item_not_found', request.url));

    const totalCost = qty * unitCost;

    // 1. Increase stock
    const { error: updErr } = await supabase
      .from('inventory_items')
      .update({ qty_on_hand: item.qty_on_hand + qty, unit_cost: unitCost })
      .eq('id', itemId);
    if (updErr) return NextResponse.redirect(new URL('/inventory?error=' + encodeURIComponent(updErr.message), request.url));

    // 2. Ledger: inventory (debit) / cash (credit)
    const memo = `Stock in: ${qty} × ${item.name} @ ${unitCost}`;
    await supabase.from('ledger_entries').insert([
      { entity_id: item.entity_id, account: 'inventory', debit: totalCost, memo, ref_type: 'stock_in', ref_id: itemId },
      { entity_id: item.entity_id, account: 'cash', credit: totalCost, memo, ref_type: 'stock_in', ref_id: itemId },
    ]);

    return NextResponse.redirect(new URL('/inventory?ok=stock_in', request.url));
  }

  if (action === 'adjust') {
    const itemId = form.get('item_id');
    const newQty = Number(form.get('qty_on_hand'));
    const reason = form.get('reason') || 'Manual adjustment';

    const { data: item } = await supabase.from('inventory_items').select('*').eq('id', itemId).single();
    if (!item) return NextResponse.redirect(new URL('/inventory?error=item_not_found', request.url));

    const diff = newQty - item.qty_on_hand;
    await supabase.from('inventory_items').update({ qty_on_hand: newQty }).eq('id', itemId);

    // Ledger only if value changed (counted at unit_cost)
    if (diff !== 0) {
      const value = Math.abs(diff) * Number(item.unit_cost);
      const entries = diff > 0
        ? [{ account: 'inventory', debit: value }, { account: 'cogs', credit: value }]
        : [{ account: 'cogs', debit: value }, { account: 'inventory', credit: value }];
      await supabase.from('ledger_entries').insert(
        entries.map(e => ({ entity_id: item.entity_id, ...e, memo: `Stock adjust: ${reason}`, ref_type: 'stock_adjust', ref_id: itemId }))
      );
    }
    return NextResponse.redirect(new URL('/inventory?ok=adjusted', request.url));
  }

  return NextResponse.redirect(new URL('/inventory?error=unknown_action', request.url));
}
