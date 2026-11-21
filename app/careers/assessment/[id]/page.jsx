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
      <div style={{ minHeight: '100vh', background: '#0a0f1d', color: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 440, background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 36, color: '#f87171', marginBottom: 12 }}>⚠</div>
          <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>Application Not Found</h2>
          <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
            We could not locate this application record. Please ensure you clicked the exact link provided or track your status.
          </p>
          <Link href="/careers/status" style={{ background: '#D4AF37', color: '#0f172a', padding: '10px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
            Find My Application
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1d', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      {/* Top Bar */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/careers" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.1em', fontWeight: 600 }}>ONLINE EVALUATION</div>
            </div>
          </Link>
          <Link href="/careers/status" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
            Track Status
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(212,175,55,0.1)', color: '#D4AF37', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            STEP 2 OF 2
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Commercial Sales Agency Evaluation
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            Answer the 6 field scenarios and provide your written pitch below. Your score and submission will be delivered immediately to our Directors.
          </p>
        </div>

        <AssessmentTest application={application} />
      </main>
    </div>
  );
}
