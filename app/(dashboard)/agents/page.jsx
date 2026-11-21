import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Agents({ searchParams }) {
  const supabase = createClient();
  const [{ data: agents }, { data: payments }] = await Promise.all([
    supabase.from('v_agent_balances').select('*').order('full_name'),
    supabase.from('commission_payments').select('*, agents(full_name)').order('paid_at', { ascending: false }).limit(20),
  ]);

  const totalPayable = (agents || []).reduce((a, x) => a + Number(x.payable), 0);

  return (
    <>
      <div className="topbar">
        <div><h1>Sales agents</h1><div className="sub">Commission balances per agent — earned, paid, and payable</div></div>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 14 }}>
        <div className="kpi"><div className="l">Total commissions payable</div>
          <div className="v" style={{ color: totalPayable > 0 ? 'var(--danger)' : 'var(--positive)' }}>{fmt(totalPayable)}</div></div>
        <div className="kpi"><div className="l">Active agents</div><div className="v">{(agents || []).filter(a => a.status === 'active').length}</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Agent balances</h3>
          <table className="tbl">
            <thead><tr><th>Agent</th><th>Subsidiary</th><th>Status</th><th className="r">Earned</th><th className="r">Paid</th><th className="r">Payable</th><th></th></tr></thead>
            <tbody>
              {(agents || []).map(a => {
                const payable = Number(a.payable);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                    <td style={{ color: 'var(--muted)' }}>{a.entity_name}</td>
                    <td><span className={'pill ' + (a.status === 'active' ? 'pos' : a.status === 'pending' ? 'gold' : 'gray')}>{a.status}</span></td>
                    <td className="r">{fmt(a.earned)}</td>
                    <td className="r">{fmt(a.paid)}</td>
                    <td className="r" style={{ fontWeight: 600, color: payable > 0 ? 'var(--danger)' : 'var(--positive)' }}>{fmt(payable)}</td>
                    <td className="r">
                      {payable > 0 && (
                        <form action="/api/commissions/pay" method="post" style={{ display: 'inline-flex', gap: 6 }}>
                          <input type="hidden" name="agent_id" value={a.id} />
                          <input name="amount" type="number" step="0.01" min="0.01" max={payable} placeholder={payable.toFixed(2)}
                            style={{ width: 90, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} required />
                          <button className="btn" type="submit" style={{ padding: '4px 10px', fontSize: 12 }}>Pay</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h3>Recent commission payments</h3>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Agent</th><th className="r">Amount</th></tr></thead>
            <tbody>
              {(payments || []).map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_at).toLocaleDateString()}</td>
                  <td>{p.agents?.full_name}</td>
                  <td className="r" style={{ color: 'var(--danger)' }}>{fmt(p.amount)}</td>
                </tr>
              ))}
              {(payments || []).length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>No payments yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
