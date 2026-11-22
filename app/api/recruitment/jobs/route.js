import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const auth = await getCurrentUserRole();
    if (!auth || auth.role !== 'director') {
      return NextResponse.json({ error: 'Unauthorized. Only directors can manage job openings.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      action = 'save',
      entityId,
      title,
      roleType = 'Commission Agency Partner',
      targetEarning,
      commissionRate = 0.10,
      slots = 5,
      description,
      requirements,
      opensAt,
      closesAt,
      status = 'open'
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Job title is required.' }, { status: 400 });
    }

    if (!closesAt) {
      return NextResponse.json({ error: 'Closing date/deadline is required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const payload = {
      entity_id: entityId || null,
      title: title.trim(),
      role_type: roleType,
      target_earning: targetEarning ? targetEarning.trim() : null,
      commission_rate: Number(commissionRate) || 0.10,
      slots: Number(slots) || 1,
      description: description ? description.trim() : null,
      requirements: requirements ? requirements.trim() : null,
      opens_at: opensAt ? new Date(opensAt).toISOString() : new Date().toISOString(),
      closes_at: new Date(closesAt).toISOString(),
      status: status || 'open',
      updated_at: new Date().toISOString()
    };

    if (id) {
      // Update existing
      const { data, error } = await admin
        .from('job_openings')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Job update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Job opening updated successfully.', job: data });
    } else {
      // Create new
      const { data, error } = await admin
        .from('job_openings')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Job insert error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'New job opening published successfully!', job: data });
    }
  } catch (err) {
    console.error('Job openings API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await getCurrentUserRole();
    if (!auth || auth.role !== 'director') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Job ID is required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await admin.from('job_openings').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Job opening deleted successfully.' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await getCurrentUserRole();
    if (!auth || auth.role !== 'director') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Job ID and status are required.' }, { status: 400 });
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await admin
      .from('job_openings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Job status updated to ${status}.` });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
