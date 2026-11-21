import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = n => n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : fmt(n);
export const dynamic = 'force-dynamic';

export default async function Subsidiaries() {
  const supabase = createClient();
  const [{ data: pnl }, { data: entities }] = await Promise.all([
    supabase.from('v_subsidiary_pnl').select('*'),
    supabase.from('entities').select('*').order('code'),
  ]);
  const pnlMap = Object.fromEntries((pnl || []).map(p => [p.id, p]));

  return (
    <>
      <div className="topbar">
        <div><h1>Subsidiaries</h1><div className="sub">Each business runs its own books — capital, revenue, costs, commissions</div></div>
      </div>
      {(entities || []).filter(e => e.kind === 'subsidiary').map(e => {
        const p = pnlMap[e.id] || {};
        const net = Number(p.net_profit || 0);
        return (
          <div className="panel" key={e.id} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: e.status === 'active' ? 'var(--navy)' : 'var(--border)',
                color: e.status === 'active' ? 'var(--gold)' : 'var(--muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                {e.code.replace('SSN-', '').slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.code} · default commission {(Number(e.commission_rate) * 100).toFixed(1)}%</div>
              </div>
              <span className={'pill ' + (e.status === 'active' ? 'gold' : 'gray')}>{e.status}</span>
            </div>
            <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 0 }}>
              <div className="kpi"><div className="l">Revenue</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.revenue || 0))}</div></div>
              <div className="kpi"><div className="l">Cost of goods</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.cogs || 0))}</div></div>
              <div className="kpi"><div className="l">Commissions</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.commissions || 0))}</div></div>
              <div className="kpi"><div className="l">Opex</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.opex || 0))}</div></div>
              <div className="kpi"><div className="l">Net P/L</div>
                <div className="v" style={{ fontSize: 20, color: net > 0 ? 'var(--positive)' : net < 0 ? 'var(--danger)' : 'inherit' }}>{fmtK(net)}</div></div>
            </div>
          </div>
        );
      })}
    </>
  );
}
