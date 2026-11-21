import Link from 'next/link';
import Image from 'next/image';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export default async function CareersPage() {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: entities } = await admin
    .from('entities')
    .select('id, name, code, kind, commission_rate')
    .eq('status', 'active')
    .order('name');

  const subsidiaries = (entities || []).filter(e => e.kind === 'subsidiary');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1d', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={38} height={38} style={{ borderRadius: 8, border: '1px solid rgba(212,175,55,0.4)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.04em', color: '#fff' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', fontWeight: 600 }}>CAREERS & RECRUITMENT</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/careers/status" style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
              Track Application
            </Link>
            <Link href="/careers/apply" style={{ background: '#D4AF37', color: '#0f172a', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 20 }}>
          OFFICIAL E-RECRUITMENT PORTAL
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#ffffff' }}>
          Build Your Career as an Authorized <br />
          <span style={{ color: '#D4AF37' }}>Sales Agency Partner</span>
        </h1>
        <p style={{ maxWidth: 680, margin: '0 auto 36px', fontSize: 18, color: '#94a3b8', lineHeight: 1.6 }}>
          Join Kenya&apos;s fastest-growing distribution and commercial network. Enjoy competitive commission structures, formal legal contracts, automated digital portal payouts, and exclusive territory rights.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/careers/apply" style={{ background: '#D4AF37', color: '#0f172a', padding: '14px 32px', borderRadius: 10, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(212,175,55,0.3)' }}>
            Start Your Application ➔
          </Link>
          <Link href="/careers/status" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '14px 28px', borderRadius: 10, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}>
            Check Application / Take Test
          </Link>
        </div>
      </section>

      {/* 3-Step Process */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Recruitment & Onboarding Process</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 6 }}>Fast, fully digital, transparent hiring pipeline</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e293b', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                1
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>1. Online Application</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                Fill out your contact details, select your target subsidiary territory, and enter your text CV, prior sales track record, and referees.
              </p>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(212,175,55,0.2)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                2
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>2. Online Evaluation Test</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                Complete a 5-minute online interview assessment testing your sales acumen, ethical cash handling, customer care, and written pitch.
              </p>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1e293b', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                3
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>3. Contract Signing</h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                Once approved by the Board of Directors, sign your official Commercial Sales Agency Agreement electronically and access your Agent Portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Territories */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Open Positions & Territories</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Select an active subsidiary to submit your application</p>
          </div>
          <Link href="/careers/apply" style={{ color: '#D4AF37', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Open Application ➔
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {subsidiaries.length > 0 ? (
            subsidiaries.map(sub => (
              <div key={sub.id} style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em' }}>{sub.code}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '4px 0 8px' }}>{sub.name}</h3>
                    </div>
                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
                      HIRING
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                    Commercial Agency Representative. Responsible for client acquisition, retail outlet management, and product distribution within the territory.
                  </p>
                  <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 20, display: 'flex', gap: 16 }}>
                    <div>Role: <b>Sales Agent</b></div>
                    <div>Target Rate: <b>{Math.round((sub.commission_rate || 0.1) * 100)}%</b></div>
                  </div>
                </div>
                <Link
                  href={`/careers/apply?subsidiary=${sub.id}`}
                  style={{ display: 'block', textAlign: 'center', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  Apply for this Territory ➔
                </Link>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, color: '#fff' }}>General Sales Agency Positions Open</h3>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0 20px' }}>Apply to represent Silent Strides Network across Kenya.</p>
              <Link href="/careers/apply" style={{ background: '#D4AF37', color: '#0f172a', padding: '10px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
                Apply Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>
        © {new Date().getFullYear()} Silent Strides Network Ltd. All rights reserved. Registered in the Republic of Kenya.
      </footer>
    </div>
  );
}
