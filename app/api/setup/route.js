import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

// POST /api/setup — action=add_owner | add_agent | add_subsidiary | add_capital
export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const back = (msg) => NextResponse.redirect(new URL('/setup?' + msg, request.url));

  // Security: only directors can manage setup and create users
  const currentAuth = await getCurrentUserRole();
  if (!currentAuth || currentAuth.role !== 'director') {
    return back('error=' + encodeURIComponent('Unauthorized. Only directors can manage setup.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Helper to create or update Supabase Auth user credentials
  async function createOrUpdateAuthUser(email, password, fullName, role) {
    const cleanEmail = email.toLowerCase().trim();
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (createError) {
      if (createError.message.toLowerCase().includes('already registered') || createError.message.toLowerCase().includes('already been registered')) {
        // User already exists in auth: update password and confirm
        const { data: userList } = await supabase.auth.admin.listUsers();
        const existing = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, {
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role },
          });
          return existing;
        }
      }
      throw new Error(createError.message);
    }
    return created.user;
  }

  // 1. ADD OWNER / DIRECTOR
  if (action === 'add_owner') {
    const fullName = form.get('full_name')?.trim();
    const email = form.get('email')?.trim().toLowerCase();
    const password = form.get('password');
    const role = form.get('role') || 'director';
    const ownershipPct = Number(form.get('ownership_pct'));

    if (!email || !password || password.length < 6) {
      return back('error=' + encodeURIComponent('Password must be at least 6 characters.'));
    }

    try {
      // 1. Create or update user in Supabase Auth
      await createOrUpdateAuthUser(email, password, fullName, role);

      // 2. Insert or update in owners table
      const { data: existing } = await supabase.from('owners').select('id').eq('email', email).maybeSingle();
      if (existing) {
        await supabase.from('owners').update({
          full_name: fullName,
          role: role,
          ownership_pct: ownershipPct,
        }).eq('id', existing.id);
      } else {
        await supabase.from('owners').insert({
          full_name: fullName,
          email: email,
          role: role,
          ownership_pct: ownershipPct,
        });
      }

      return back('ok=' + encodeURIComponent(`Owner & login created for ${fullName} (${email})`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // 2. ADD SALES AGENT
  if (action === 'add_agent') {
    const fullName = form.get('full_name')?.trim();
    const email = form.get('email')?.trim().toLowerCase();
    const password = form.get('password');
    const phone = form.get('phone')?.trim() || null;
    const entityId = form.get('entity_id');
    const commissionRate = Number(form.get('commission_rate') || 0.10);
    const status = form.get('status') || 'active';
    const agreementSigned = form.get('agreement_signed') === '1';

    if (!email || !password || password.length < 6) {
      return back('error=' + encodeURIComponent('Password must be at least 6 characters.'));
    }

    try {
      // 1. Create or update user in Supabase Auth
      await createOrUpdateAuthUser(email, password, fullName, 'agent');

      // 2. Insert or update in agents table
      const { data: existing } = await supabase.from('agents').select('id').eq('email', email).maybeSingle();
      if (existing) {
        await supabase.from('agents').update({
          entity_id: entityId,
          full_name: fullName,
          phone: phone,
          commission_rate: commissionRate,
          status: status,
          agreement_signed_at: agreementSigned ? new Date().toISOString() : null,
        }).eq('id', existing.id);
      } else {
        await supabase.from('agents').insert({
          entity_id: entityId,
          full_name: fullName,
          email: email,
          phone: phone,
          commission_rate: commissionRate,
          status: status,
          agreement_signed_at: agreementSigned ? new Date().toISOString() : null,
        });
      }

      return back('ok=' + encodeURIComponent(`Sales Agent & login created for ${fullName} (${email})`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // 3. ADD SUBSIDIARY
  if (action === 'add_subsidiary') {
    const { error } = await supabase.from('entities').insert({
      code: form.get('code')?.trim().toUpperCase(),
      name: form.get('name')?.trim(),
      kind: 'subsidiary',
      status: form.get('status') || 'planned',
      commission_rate: Number(form.get('commission_rate') || 0.10),
    });
    return back(error ? 'error=' + encodeURIComponent(error.message) : 'ok=subsidiary_added');
  }

  // 4. ADD CAPITAL
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
