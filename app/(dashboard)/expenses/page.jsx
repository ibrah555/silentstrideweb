import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

const ACCOUNTS = ['opex', 'cogs', 'payable', 'commission_expense'];

export default async function Expenses() {
  const supabase = createClient();
  const [{ data: expenses }, { data: entities }] = await Promise.all([
    supabase.from('expenses').select('*, entities(code)').order('spent_at', { ascending: false }).limit(100),
    supabase.from('entities').select('id, code, name').eq('status', 'active').order('code'),
  ]);

  const total = (expenses || []).reduce((a, e) => a + Number(e.amount), 0);

  return (
    <>
      <div className="topbar">
        <div><h1>Expenses</h1><div className="sub">Every shilling out — auto-posted to the ledger</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Expense history</h3>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Entity</th><th>Account</th><th>Memo</th><th className="r">Amount</th></tr></thead>
            <tbody>
              {(expenses || []).map(e => (
                <tr key={e.id}>
                  <td>{e.spent_at}</td>
                  <td>{e.entities?.code}</td>
                  <td style={{ color: 'var(--muted)' }}>{e.account.replace(/_/g, ' ')}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 13 }}>{e.memo}</td>
                  <td className="r" style={{ color: 'var(--danger)' }}>{fmt(e.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: 600 }}>
                <td colSpan={4} style={{ paddingTop: 12 }}>Total shown</td>
                <td className="r" style={{ paddingTop: 12 }}>{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="panel">
          <h3>Record an expense</h3>
          <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/expenses" method="post">
            <label className="f">Subsidiary
              <select name="entity_id" required>{(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}</select>
            </label>
            <label className="f">Account
              <select name="account">{ACCOUNTS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}</select>
            </label>
            <label className="f">Amount<input name="amount" type="number" step="0.01" min="0.01" required /></label>
            <label className="f">Date<input name="spent_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
            <label className="f">Memo<input name="memo" placeholder="What was this for?" /></label>
            <button className="btn gold" type="submit">Record expense</button>
          </form>
        </div>
      </div>
    </>
  );
}
