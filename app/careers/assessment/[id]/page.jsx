import Link from 'next/link';
import Image from 'next/image';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import AssessmentTest from '@/components/AssessmentTest';

export const dynamic = 'force-dynamic';

export default async function AssessmentPage({ params }) {
  const { id } = params;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: application, error } = await admin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !application) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F6F2', color: '#1A2430', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 440, background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 32, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 36, color: '#B3372F', marginBottom: 12 }}>⚠</div>
          <h2 style={{ fontSize: 20, color: '#082138', marginBottom: 8 }}>Application Not Found</h2>
          <p style={{ color: '#6B7684', fontSize: 14, marginBottom: 20 }}>
            We could not locate this application record. Please ensure you clicked the exact link provided or track your status.
          </p>
          <Link href="/careers/status" style={{ background: '#082138', color: '#FFFFFF', padding: '10px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
            Find My Application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', color: '#1A2430', fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      {/* Top Bar */}
      <header style={{ borderBottom: '1px solid #E4E1D8', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/careers" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} style={{ borderRadius: 8, border: '1px solid #E4E1D8' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#082138' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 11, color: '#AE8E4D', letterSpacing: '0.08em', fontWeight: 600 }}>ONLINE EVALUATION</div>
            </div>
          </Link>
          <Link href="/careers/status" style={{ color: '#6B7684', fontSize: 14, textDecoration: 'none' }}>
            Track Status
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#F3EBDC', color: '#7A6234', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            STEP 2 OF 2
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#082138', margin: '0 0 10px' }}>
            Commercial Sales Agency Evaluation
          </h1>
          <p style={{ color: '#6B7684', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            Answer the 6 field scenarios and provide your written pitch below. Your score and submission will be delivered immediately to our Directors.
          </p>
        </div>

        <AssessmentTest application={application} />
      </main>
    </div>
  );
}
