import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const back = (msg) => NextResponse.redirect(new URL('/agents?' + msg, request.url));

  const auth = await getCurrentUserRole();
  if (!auth || auth.role !== 'director') {
    return back('error=' + encodeURIComponent('Unauthorized. Only directors can manage sales agents.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // CREATE AGENT
  if (action === 'create') {
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
      // 1. Create in Supabase Auth
      const { error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: 'agent' },
      });

      if (authError && !authError.message.toLowerCase().includes('already registered')) {
        return back('error=' + encodeURIComponent(authError.message));
      }

      if (authError && authError.message.toLowerCase().includes('already registered')) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email?.toLowerCase() === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
        }
      }

      // 2. Insert into agents table
      const { error: dbError } = await supabase.from('agents').insert({
        entity_id: entityId,
        full_name: fullName,
        email,
        phone,
        commission_rate: commissionRate,
        status,
        agreement_signed_at: agreementSigned ? new Date().toISOString() : null,
      });

      if (dbError) return back('error=' + encodeURIComponent(dbError.message));
      return back('ok=' + encodeURIComponent(`Agent ${fullName} created successfully.`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // UPDATE AGENT
  if (action === 'update') {
    const id = form.get('id');
    const fullName = form.get('full_name')?.trim();
    const email = form.get('email')?.trim().toLowerCase();
    const phone = form.get('phone')?.trim() || null;
    const entityId = form.get('entity_id');
    const commissionRate = Number(form.get('commission_rate') || 0.10);
    const status = form.get('status') || 'active';
    const newPassword = form.get('new_password');

    try {
      // If new password provided, update Supabase Auth
      if (newPassword && newPassword.length >= 6) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const authUser = list?.users?.find(u => u.email?.toLowerCase() === email);
        if (authUser) {
          await supabase.auth.admin.updateUserById(authUser.id, { password: newPassword });
        }
      }

      // Update agents row
      const { error: dbError } = await supabase.from('agents').update({
        entity_id: entityId,
        full_name: fullName,
        phone,
        commission_rate: commissionRate,
        status,
      }).eq('id', id);

      if (dbError) return back('error=' + encodeURIComponent(dbError.message));
      return back('ok=' + encodeURIComponent(`Agent ${fullName} updated successfully.`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // DELETE AGENT
  if (action === 'delete') {
    const id = form.get('id');
    const email = form.get('email')?.trim().toLowerCase();

    try {
      // 1. Delete from Supabase Auth
      const { data: list } = await supabase.auth.admin.listUsers();
      const authUser = list?.users?.find(u => u.email?.toLowerCase() === email);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }

      // 2. Delete from agents table
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (error) return back('error=' + encodeURIComponent(error.message));

      return back('ok=' + encodeURIComponent('Sales Agent removed successfully.'));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  return back('error=unknown_action');
}
