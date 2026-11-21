import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { fmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AgentPortal({ searchParams }) {
  const auth = await getCurrentUserRole();

  if (!auth) {
    redirect('/login');
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let agent = null;
  let isDirectorPreview = false;

  if (auth.role === 'agent') {
    agent = auth.profile;
  } else if (auth.role === 'director') {
    isDirectorPreview = true;
    // For director testing: fetch the first active agent
    const { data: firstAgent } = await admin
      .from('agents')
      .select('*, entities(id, code, name, commission_rate)')
      .limit(1)
      .maybeSingle();
    agent = firstAgent;
  } else {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="panel" style={{ maxWidth: 440, textAlign: 'center' }}>
          <h2>Access Pending</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Your account ({auth.user.email}) is authenticated, but has not yet been assigned to an active Sales Agent or Director record.
          </p>
          <form action="/auth/sign-out" method="post">
            <button className="btn" type="submit" style={{ marginTop: 12 }}>Sign Out</button>
          </form>
        </div>
      </div>
    );
  }

  // Fetch balance and sales data for this agent
  let balance = { earned: 0, paid: 0, payable: 0 };
  let sales = [];
  let payments = [];

  if (agent) {
    const [{ data: b }, { data: s }, { data: p }] = await Promise.all([
      admin.from('v_agent_balances').select('*').eq('id', agent.id).maybeSingle(),
      admin.from('sales').select('*').eq('agent_id', agent.id).order('sold_at', { ascending: false }).limit(25),
      admin.from('commission_payments').select('*').eq('agent_id', agent.id).order('paid_at', { ascending: false }).limit(10),
    ]);

    if (b) balance = b;
    if (s) sales = s;
    if (p) payments = p;
  }

  const commissionRatePct = (Number(agent?.commission_rate || 0.10) * 100).toFixed(1);
  const okMsg = searchParams?.ok === '1' ? 'Sale recorded successfully! Your commission has been credited.' : null;
  const errorMsg = searchParams?.error;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Top Navbar */}
        <header style={{
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: 14,
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo.jpg" alt="Silent Strides" width={40} height={40} style={{ borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Silent Strides Network</div>
              <div style={{ fontSize: 12, color: 'var(--gold)' }}>Sales Agent Portal</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{agent?.full_name || auth.user.email}</div>
              <div style={{ fontSize: 12, color: '#C9CFD8' }}>
                {agent?.entities?.name || 'Assigned Subsidiary'} · {commissionRatePct}% Comm.
              </div>
            </div>
            
            {isDirectorPreview && (
              <Link href="/dashboard" className="btn gold" style={{ fontSize: 12, padding: '6px 12px' }}>
                Command Center ➔
              </Link>
            )}

            <form action="/auth/sign-out" method="post" style={{ margin: 0 }}>
              <button className="btn" type="submit" style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.1)' }}>
                Sign out
              </button>
            </form>
          </div>
        </header>

        {/* Feedback Banners */}
        {okMsg && (
          <div style={{
            background: '#ECFDF5',
            color: 'var(--positive)',
            border: '1px solid #A7F3D0',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
            fontWeight: 500
          }}>
            ✓ {okMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#FEF2F2',
            color: 'var(--danger)',
            border: '1px solid #FECACA',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14
          }}>
            ⚠ {errorMsg}
          </div>
        )}

        {isDirectorPreview && (
          <div style={{
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 13
          }}>
            ℹ <b>Director Preview Mode:</b> You are previewing how sales agents see their portal. Sales submitted here will attribute to {agent?.full_name || 'the agent'}.
          </div>
        )}

        {/* KPI Cards */}
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 20 }}>
          <div className="kpi" style={{ borderLeft: '4px solid var(--gold)' }}>
            <div className="l">Pending Commission (Payable)</div>
            <div className="v" style={{ color: Number(balance.payable) > 0 ? 'var(--gold)' : 'inherit' }}>
              {fmt(balance.payable)}
            </div>
            <div className="s">Ready for payout</div>
          </div>

          <div className="kpi">
            <div className="l">Total Commission Earned</div>
            <div className="v">{fmt(balance.earned)}</div>
            <div className="s">All-time earnings ({commissionRatePct}%)</div>
          </div>

          <div className="kpi">
            <div className="l">Total Paid Out</div>
            <div className="v" style={{ color: 'var(--positive)' }}>{fmt(balance.paid)}</div>
            <div className="s">Disbursed to your account</div>
          </div>

          <div className="kpi">
            <div className="l">Total Sales Logged</div>
            <div className="v">{sales.length}</div>
            <div className="s">Recent transactions</div>
          </div>
        </div>

        {/* 2-Column Content */}
        <div className="grid2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, alignItems: 'start' }}>
          
          {/* Submit New Sale Form */}
          <div className="panel">
            <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Submit New Sale</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
              Log a customer sale for {agent?.entities?.name || 'your subsidiary'}. Commission applies immediately.
            </p>

            <form action="/api/sales" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="hidden" name="source" value="portal" />
              {agent && <input type="hidden" name="entity_id" value={agent.entity_id} />}
              {agent && <input type="hidden" name="agent_id" value={agent.id} />}

              <label className="f">
                Subsidiary
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${agent?.entities?.code || 'SSN'} — ${agent?.entities?.name || 'Product Sales'}`}
                  style={{ background: '#F1EFEA', cursor: 'not-allowed' }}
                />
              </label>

              <label className="f">
                Sale Total Amount (KSh)
                <input
                  name="total_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 50000.00"
                />
              </label>

              <label className="f">
                Batch / Customer / Receipt Note (Optional)
                <input
                  name="batch_label"
                  placeholder="e.g. Invoice #204, Customer Order"
                />
              </label>

              <div style={{
                background: '#F9F8F5',
                border: '1px dashed var(--border)',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--muted)'
              }}>
                ℹ Your commission rate is <b>{commissionRatePct}%</b>. For example, a KSh 10,000.00 sale adds <b>{fmt(10000 * Number(agent?.commission_rate || 0.10))}</b> to your pending balance automatically.
              </div>

              <button className="btn gold" type="submit" style={{ justifyContent: 'center', marginTop: 4, padding: '10px 16px' }}>
                + Record Sale & Accrue Commission
              </button>
            </form>
          </div>

          {/* Sales History */}
          <div className="panel">
            <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>My Sales Activity</h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch / Note</th>
                    <th className="r">Sale Amount</th>
                    <th className="r">My Commission</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontSize: 13 }}>{new Date(s.sold_at).toLocaleDateString()}</td>
                      <td style={{ fontSize: 13, color: 'var(--muted)' }}>{s.batch_label || 'Direct Sale'}</td>
                      <td className="r" style={{ fontWeight: 500 }}>{fmt(s.total_amount)}</td>
                      <td className="r" style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(s.commission_amount)}</td>
                      <td>
                        <span className="pill pos">{s.status || 'recorded'}</span>
                      </td>
                    </tr>
                  ))}

                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                        No sales logged yet. Submit your first sale on the left!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Payout History Section */}
            {payments.length > 0 && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>Recent Payouts Received</h4>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th className="r">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>{new Date(p.paid_at).toLocaleDateString()}</td>
                        <td className="r" style={{ color: 'var(--positive)', fontWeight: 600 }}>{fmt(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
