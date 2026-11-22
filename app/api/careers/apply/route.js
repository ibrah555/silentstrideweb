import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function generateAppCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `SSN-${year}-${rand}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      jobId,
      fullName,
      email,
      phone,
      idNumber,
      residence,
      entityId,
      position = 'Sales Agency Representative',
      bio,
      experience,
      education,
      referees
    } = body;

    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Full name, email address, and phone number are required.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // If jobId provided, check if the job opening is still open and deadline has not passed
    if (jobId) {
      const { data: job } = await admin
        .from('job_openings')
        .select('id, title, closes_at, status')
        .eq('id', jobId)
        .single();

      if (job) {
        if (job.status === 'closed' || (job.closes_at && new Date() > new Date(job.closes_at))) {
          return NextResponse.json(
            { error: `Applications for "${job.title}" have closed. Deadline was ${new Date(job.closes_at).toLocaleDateString()}.` },
            { status: 400 }
          );
        }
      }
    }

    // Check if an application already exists with this email or phone
    const { data: existing } = await admin
      .from('applications')
      .select('id, app_code, status')
      .or(`email.eq.${email.trim().toLowerCase()},phone.eq.${phone.trim()}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      // Return existing application info so candidate can resume or view
      const app = existing[0];
      return NextResponse.json({
        success: true,
        alreadyApplied: true,
        message: 'An existing application was found for your contact details.',
        application: {
          id: app.id,
          appCode: app.app_code,
          status: app.status
        }
      });
    }

    const appCode = generateAppCode();

    const insertPayload = {
      app_code: appCode,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      id_number: idNumber ? idNumber.trim() : null,
      residence: residence ? residence.trim() : null,
      entity_id: entityId || null,
      job_id: jobId || null,
      position: position || 'Sales Agency Representative',
      bio: bio ? bio.trim() : null,
      experience: experience ? experience.trim() : null,
      education: education ? education.trim() : null,
      referees: referees ? referees.trim() : null,
      status: 'applied'
    };

    const { data, error } = await admin
      .from('applications')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Application insert error:', error);
      return NextResponse.json(
        { error: error.message || 'Database error occurred while submitting application.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully!',
      application: {
        id: data.id,
        appCode: data.app_code,
        fullName: data.full_name,
        email: data.email
      }
    });
  } catch (err) {
    console.error('Apply API unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
