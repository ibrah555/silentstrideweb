import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { fmt, fmtK } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const supabase = createClient();

  const [{ data: pnl }, { data: ledger }, { data: agents }, { data: contributions }] = await Promise.all([
    supabase.from('v_subsidiary_pnl').select('*'),
    supabase.from('ledger_entries').select('*, entities(code)').order('entry_date', { ascending: false }).limit(8),
    supabase.from('v_agent_balances').select('*'),
    supabase.from('capital_contributions').select('amount'),
  ]);

  const totalCapital = (contributions || []).reduce((a, c) => a + Number(c.amount || 0), 0);

  const group = (pnl || []).reduce((a, s) => ({
    revenue: a.revenue + Number(s.revenue),
    net: a.net + Number(s.net_profit),
    comm: a.comm + Number(s.commissions),
  }), { revenue: 0, net: 0, comm: 0 });

  const payable = (agents || []).reduce((a, x) => a + Number(x.payable), 0);
  const { data: cashRows } = await supabase.from('ledger_entries').select('debit, credit, account');
  const cash = (cashRows || []).filter(r => r.account === 'cash').reduce((a, r) => a + Number(r.debit) - Number(r.credit), 0);

  // Accounting Equity (Net Worth) = Paid-In Capital + Retained Earnings (Cumulative Net Profit)
  const networth = totalCapital + group.net;

  const maxNW = Math.max(...(pnl || []).map(s => Math.abs(Number(s.net_profit))), 1);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Group overview</h1>
          <div className="sub">Every subsidiary, every penny — in real time</div>
        </div>
        <Link href="/sales" className="btn gold">+ Record sale</Link>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="l">Group net worth</div><div className="v">{fmt(networth)}</div>
          <div className="s">Capital + retained earnings</div></div>
        <div className="kpi"><div className="l">Cash on hand</div><div className="v">{fmt(cash)}</div>
          <div className="s">All entity accounts</div></div>
        <div className="kpi"><div className="l">Revenue (all time)</div><div className="v">{fmt(group.revenue)}</div>
          <div className="s">Across {(pnl || []).length} entities</div></div>
        <div className="kpi"><div className="l">Commissions payable</div><div className="v">{fmt(payable)}</div>
          <div className="s">Owed to active agents</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Net profit by subsidiary</h3>
          {(pnl || []).map(s => (
            <div className="bar-row" key={s.id}>
              <div className="n">{s.name.replace('SSN ', '')}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: Math.max(4, Math.abs(Number(s.net_profit)) / maxNW * 100) + '%' }} />
              </div>
              <div className="a">{fmtK(Number(s.net_profit))}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Recent ledger activity</h3>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Entity</th><th>Account</th><th className="r">Debit</th><th className="r">Credit</th></tr></thead>
            <tbody>
              {(ledger || []).map(e => (
                <tr key={e.id}>
                  <td>{e.entry_date}</td>
                  <td>{e.entities?.code}</td>
                  <td style={{ color: 'var(--muted)' }}>{e.account.replace(/_/g, ' ')}</td>
                  <td className="r" style={{ color: e.debit > 0 ? 'var(--danger)' : 'inherit' }}>{e.debit > 0 ? fmt(e.debit) : ''}</td>
                  <td className="r" style={{ color: e.credit > 0 ? 'var(--positive)' : 'inherit' }}>{e.credit > 0 ? fmt(e.credit) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
