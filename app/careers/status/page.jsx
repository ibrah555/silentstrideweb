import Link from 'next/link';
import Image from 'next/image';
import StatusLookup from '@/components/StatusLookup';

export const dynamic = 'force-dynamic';

export default function StatusPage({ searchParams }) {
  const initialQuery = searchParams?.q || '';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1d', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>
      {/* Top Bar */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/careers" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.1em', fontWeight: 600 }}>CAREERS PORTAL</div>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link href="/careers" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
              ← Careers Home
            </Link>
            <Link href="/careers/apply" style={{ color: '#D4AF37', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 840, margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Track Application Status
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            Check real-time hiring progress, complete pending evaluation assessments, or view your official approved contract.
          </p>
        </div>

        <StatusLookup initialQuery={initialQuery} />
      </main>
    </div>
  );
}
