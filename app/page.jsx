import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export default async function Home() {
  const auth = await getCurrentUserRole();
  if (!auth) {
    redirect('/login');
  }

  if (auth.role === 'agent') {
    redirect('/portal');
  }

  if (auth.role === 'director') {
    redirect('/dashboard');
  }

  // Guest user — logged in but not a director or agent
  // Check if any directors exist; if not, show bootstrap page
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: directors } = await admin
    .from('owners')
    .select('id')
    .in('role', ['director', 'shareholder', 'investor']);

  const noDirectors = !directors || directors.length === 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ maxWidth: 480, padding: 40, borderRadius: 12, background: '#1e293b', color: '#e2e8f0', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, marginBottom: 16, color: '#38bdf8' }}>Silent Strides Network</h1>
        <p style={{ marginBottom: 8 }}>Logged in as: <strong>{auth.user.email}</strong></p>
        {noDirectors ? (
          <>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>
              No directors exist yet. Click below to register yourself as the first director.
            </p>
            <form action="/api/bootstrap" method="POST">
              <button type="submit" style={{
                padding: '12px 32px', borderRadius: 8, border: 'none',
                background: '#22c55e', color: '#fff', fontSize: 16,
                cursor: 'pointer', fontWeight: 600
              }}>
                🚀 Register as First Director
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={{ color: '#f87171', marginBottom: 24 }}>
              Your account is not registered as a Director or Sales Agent.
              Please contact a Director to add you to the system.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
