import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export async function POST(request) {
  const form = await request.formData();
  const action = form.get('action');
  const back = (msg) => NextResponse.redirect(new URL('/directors?' + msg, request.url));

  const auth = await getCurrentUserRole();
  if (!auth || auth.role !== 'director') {
    return back('error=' + encodeURIComponent('Unauthorized. Only directors can manage users.'));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // CREATE DIRECTOR
  if (action === 'create') {
    const fullName = form.get('full_name')?.trim();
    const email = form.get('email')?.trim().toLowerCase();
    const password = form.get('password');
    const role = form.get('role') || 'director';
    const ownershipPct = Number(form.get('ownership_pct'));

    if (!email || !password || password.length < 6) {
      return back('error=' + encodeURIComponent('Password must be at least 6 characters.'));
    }

    try {
      // 1. Create in Supabase Auth
      const { error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

      if (authError && !authError.message.toLowerCase().includes('already registered')) {
        return back('error=' + encodeURIComponent(authError.message));
      }

      // If user already existed, update password
      if (authError && authError.message.toLowerCase().includes('already registered')) {
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(u => u.email?.toLowerCase() === email);
        if (existing) {
          await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
        }
      }

      // 2. Insert into owners table
      const { error: dbError } = await supabase.from('owners').insert({
        full_name: fullName,
        email,
        role,
        ownership_pct: ownershipPct,
      });

      if (dbError) return back('error=' + encodeURIComponent(dbError.message));
      return back('ok=' + encodeURIComponent(`Director ${fullName} created successfully.`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // UPDATE DIRECTOR
  if (action === 'update') {
    const id = form.get('id');
    const fullName = form.get('full_name')?.trim();
    const email = form.get('email')?.trim().toLowerCase();
    const role = form.get('role') || 'director';
    const ownershipPct = Number(form.get('ownership_pct'));
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

      // Update owners row
      const { error: dbError } = await supabase.from('owners').update({
        full_name: fullName,
        role,
        ownership_pct: ownershipPct,
      }).eq('id', id);

      if (dbError) return back('error=' + encodeURIComponent(dbError.message));
      return back('ok=' + encodeURIComponent(`Director ${fullName} updated successfully.`));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  // DELETE DIRECTOR
  if (action === 'delete') {
    const id = form.get('id');
    const email = form.get('email')?.trim().toLowerCase();

    // Prevent deleting oneself
    if (email === auth.user.email.toLowerCase()) {
      return back('error=' + encodeURIComponent('You cannot delete your own logged-in account.'));
    }

    try {
      // 1. Delete from Supabase Auth
      const { data: list } = await supabase.auth.admin.listUsers();
      const authUser = list?.users?.find(u => u.email?.toLowerCase() === email);
      if (authUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }

      // 2. Delete from owners table
      const { error } = await supabase.from('owners').delete().eq('id', id);
      if (error) return back('error=' + encodeURIComponent(error.message));

      return back('ok=' + encodeURIComponent('Director removed successfully.'));
    } catch (err) {
      return back('error=' + encodeURIComponent(err.message));
    }
  }

  return back('error=unknown_action');
}
