import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import RecruitmentDashboard from '@/components/RecruitmentDashboard';

export const dynamic = 'force-dynamic';

export default async function RecruitmentPage() {
  const auth = await getCurrentUserRole();
  if (!auth) {
    redirect('/login');
  }

  if (auth.role !== 'director') {
    redirect('/');
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Fetch applications and subsidiaries
  let applications = [];
  try {
    const { data: apps, error } = await admin
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && apps) {
      applications = apps;
    }
  } catch (err) {
    console.error('Fetch applications error (may need migration):', err);
  }

  const { data: entities } = await admin
    .from('entities')
    .select('id, name, code, kind')
    .order('name');

  const subsidiaries = (entities || []).filter(e => e.kind === 'subsidiary');

  // KPI calculations
  const totalApps = applications.length;
  const assessedApps = applications.filter(a => a.test_completed_at).length;
  const highScorers = applications.filter(a => (a.test_score || 0) >= 70).length;
  const hiredCount = applications.filter(a => a.status === 'hired' || a.agent_id).length;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>E-Recruitment & Evaluation Assessments</h1>
          <div className="sub">
            Review incoming sales agent applications, evaluate online interview test scores, and onboard approved candidates
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-lbl">Total Applicants</div>
          <div className="card-val">{totalApps}</div>
          <div className="card-sub">All registered submissions</div>
        </div>

        <div className="card">
          <div className="card-lbl">Tests Completed</div>
          <div className="card-val" style={{ color: '#38bdf8' }}>{assessedApps}</div>
          <div className="card-sub">Finished online evaluation</div>
        </div>

        <div className="card">
          <div className="card-lbl">Top Scorers (≥70%)</div>
          <div className="card-val" style={{ color: '#D4AF37' }}>{highScorers}</div>
          <div className="card-sub">High commercial & ethics aptitude</div>
        </div>

        <div className="card">
          <div className="card-lbl">Onboarded / Hired</div>
          <div className="card-val" style={{ color: 'var(--positive)' }}>{hiredCount}</div>
          <div className="card-sub">Contracts issued & active</div>
        </div>
      </div>

      <RecruitmentDashboard
        applications={applications}
        entities={subsidiaries.length > 0 ? subsidiaries : (entities || [])}
      />
    </>
  );
}
