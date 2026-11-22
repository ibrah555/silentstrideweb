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
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#1A2430', fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      {/* Top Navigation */}
      <header style={{ borderBottom: '1px solid #E4E1D8', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo.jpg" alt="Silent Strides Network" width={38} height={38} style={{ borderRadius: 8, border: '1px solid #E4E1D8' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#082138', letterSpacing: '0.02em' }}>SILENT STRIDES</div>
              <div style={{ fontSize: 11, color: '#AE8E4D', letterSpacing: '0.08em', fontWeight: 600 }}>CAREERS & RECRUITMENT</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/careers/status" style={{ color: '#6B7684', fontSize: 14, textDecoration: 'none', fontWeight: 500 }}>
              Track Application
            </Link>
            <Link href="/careers/apply" style={{ background: '#082138', color: '#FFFFFF', padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: '#F3EBDC', border: '1px solid #E4E1D8', color: '#7A6234', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 20 }}>
          OFFICIAL E-RECRUITMENT PORTAL
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#082138' }}>
          Build Your Career as an Authorized <br />
          <span style={{ color: '#AE8E4D' }}>Sales Agency Partner</span>
        </h1>
        <p style={{ maxWidth: 680, margin: '0 auto 36px', fontSize: 17, color: '#6B7684', lineHeight: 1.6 }}>
          Join Kenya&apos;s fastest-growing distribution and commercial network. Enjoy competitive commission structures, formal legal contracts, automated digital portal payouts, and designated territory rights.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/careers/apply" style={{ background: '#082138', color: '#FFFFFF', padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 12px rgba(8,33,56,0.15)' }}>
            Start Your Application ➔
          </Link>
          <Link href="/careers/status" style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', color: '#1A2430', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Check Application / Take Test
          </Link>
        </div>
      </section>

      {/* 3-Step Process */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ background: '#F7F6F2', border: '1px solid #E4E1D8', borderRadius: 16, padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#082138', margin: 0 }}>Recruitment & Onboarding Process</h2>
            <p style={{ color: '#6B7684', fontSize: 14, marginTop: 6 }}>Fast, fully digital, transparent hiring pipeline</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#082138', color: '#AE8E4D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                1
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#082138', marginBottom: 8 }}>1. Online Application</h3>
              <p style={{ fontSize: 13, color: '#6B7684', lineHeight: 1.5, margin: 0 }}>
                Fill out your contact details, select your target subsidiary territory, and enter your text CV, prior sales track record, and referees.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #AE8E4D', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3EBDC', color: '#7A6234', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                2
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#082138', marginBottom: 8 }}>2. Online Evaluation Test</h3>
              <p style={{ fontSize: 13, color: '#6B7684', lineHeight: 1.5, margin: 0 }}>
                Complete a 5-minute online interview assessment testing your sales acumen, ethical cash handling, customer care, and written pitch.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E4F2EA', color: '#1E7F4F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: 16 }}>
                3
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#082138', marginBottom: 8 }}>3. Contract Signing</h3>
              <p style={{ fontSize: 13, color: '#6B7684', lineHeight: 1.5, margin: 0 }}>
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
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#082138', margin: 0 }}>Open Positions & Territories</h2>
            <p style={{ color: '#6B7684', fontSize: 14, marginTop: 4 }}>Select an active subsidiary to submit your application</p>
          </div>
          <Link href="/careers/apply" style={{ color: '#AE8E4D', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Open Application ➔
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {subsidiaries.length > 0 ? (
            subsidiaries.map(sub => (
              <div key={sub.id} style={{ background: '#FFFFFF', border: '1px solid #E4E1D8', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#AE8E4D', fontWeight: 700, letterSpacing: '0.06em' }}>{sub.code}</div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#082138', margin: '4px 0 8px' }}>{sub.name}</h3>
                    </div>
                    <span style={{ background: '#E4F2EA', color: '#1E7F4F', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6 }}>
                      HIRING
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#6B7684', lineHeight: 1.5, marginBottom: 16 }}>
                    Commercial Agency Representative. Responsible for client acquisition, retail outlet management, and product distribution within the territory.
                  </p>
                  <div style={{ fontSize: 13, color: '#1A2430', marginBottom: 20, display: 'flex', gap: 16 }}>
                    <div>Role: <b>Sales Agent</b></div>
                    <div>Target Rate: <b>{Math.round((sub.commission_rate || 0.1) * 100)}%</b></div>
                  </div>
                </div>
                <Link
                  href={`/careers/apply?subsidiary=${sub.id}`}
                  style={{ display: 'block', textAlign: 'center', background: '#F3EBDC', border: '1px solid #E4E1D8', color: '#7A6234', padding: '10px 16px', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
                >
                  Apply for this Territory ➔
                </Link>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', background: '#F7F6F2', border: '1px solid #E4E1D8', borderRadius: 12, padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, color: '#082138', margin: 0 }}>General Sales Agency Positions Open</h3>
              <p style={{ color: '#6B7684', fontSize: 14, margin: '8px 0 20px' }}>Apply to represent Silent Strides Network across Kenya.</p>
              <Link href="/careers/apply" style={{ background: '#082138', color: '#FFFFFF', padding: '10px 24px', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
                Apply Now
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E4E1D8', padding: '24px', textAlign: 'center', color: '#6B7684', fontSize: 12, background: '#F7F6F2' }}>
        © {new Date().getFullYear()} Silent Strides Network Ltd. All rights reserved. Registered in the Republic of Kenya.
      </footer>
    </div>
  );
}
