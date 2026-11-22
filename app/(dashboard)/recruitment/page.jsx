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

  // Fetch applications, subsidiaries, and job openings
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

  let jobOpenings = [];
  try {
    const { data: jobs, error: jobsErr } = await admin
      .from('job_openings')
      .select('*, entities(id, code, name)')
      .order('created_at', { ascending: false });

    if (!jobsErr && jobs) {
      jobOpenings = jobs;
    }
  } catch (err) {
    console.error('Fetch job_openings error (may need migration):', err);
  }

  const { data: entities } = await admin
    .from('entities')
    .select('id, name, code, kind')
    .order('name');

  const subsidiaries = (entities || []).filter(e => e.kind === 'subsidiary');

  // KPI calculations
  const totalApps = applications.length;
  const activeJobs = jobOpenings.filter(j => j.status === 'open' && (!j.closes_at || new Date().getTime() < new Date(j.closes_at).getTime())).length;
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

      {/* KPI Cards matching system theme */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi" style={{ borderLeft: '4px solid var(--navy)' }}>
          <div className="l">Total Applicants</div>
          <div className="v">{totalApps}</div>
          <div className="s">All registered submissions</div>
        </div>

        <div className="kpi" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="l">Active Job Openings</div>
          <div className="v" style={{ color: '#0369a1' }}>{activeJobs}</div>
          <div className="s">Live countdown windows</div>
        </div>

        <div className="kpi" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="l">Top Scorers (≥70%)</div>
          <div className="v" style={{ color: '#7A6234' }}>{highScorers}</div>
          <div className="s">High commercial & ethics aptitude</div>
        </div>

        <div className="kpi" style={{ borderLeft: '4px solid var(--positive)' }}>
          <div className="l">Onboarded / Hired</div>
          <div className="v" style={{ color: 'var(--positive)' }}>{hiredCount}</div>
          <div className="s">Contracts issued & active</div>
        </div>
      </div>

      <RecruitmentDashboard
        applications={applications}
        jobOpenings={jobOpenings}
        entities={subsidiaries.length > 0 ? subsidiaries : (entities || [])}
      />
    </>
  );
}
