import Link from 'next/link';
import Image from 'next/image';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import ApplicationForm from '@/components/ApplicationForm';

export const dynamic = 'force-dynamic';

export default async function ApplyPage({ searchParams }) {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const jobId = searchParams?.job || '';
  const preselectedSubsidiary = searchParams?.subsidiary || '';

  const [{ data: entities }, { data: job }] = await Promise.all([
    admin.from('entities').select('id, name, code, kind').eq('status', 'active').order('name'),
    jobId ? admin.from('job_openings').select('*, entities(id, code, name)').eq('id', jobId).single() : Promise.resolve({ data: null })
  ]);

  const subsidiaries = (entities || []).filter(e => e.kind === 'subsidiary');

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', color: '#1A2430', fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      {/* Top Navigation */}
      <header style={{ borderBottom: '1px solid #E4E1D8', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/careers" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} style={{ borderRadius: 8, border: '1px solid #E4E1D8' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#082138' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 11, color: '#AE8E4D', letterSpacing: '0.08em', fontWeight: 600 }}>CAREERS PORTAL</div>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/careers" style={{ color: '#6B7684', fontSize: 14, textDecoration: 'none' }}>
              ← All Positions
            </Link>
            <Link href="/careers/status" style={{ color: '#082138', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              Track Status
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#F3EBDC', color: '#7A6234', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            STEP 1 OF 2
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#082138', margin: '0 0 10px' }}>
            {job ? `Application for ${job.title}` : 'Sales Agency Partner Application'}
          </h1>
          <p style={{ color: '#6B7684', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            Complete your profile and text CV below. Once submitted, you will immediately take the online evaluation assessment.
          </p>
        </div>

        <ApplicationForm
          subsidiaries={subsidiaries}
          preselectedSubsidiary={job?.entity_id || preselectedSubsidiary}
          job={job}
        />
      </main>
    </div>
  );
}
