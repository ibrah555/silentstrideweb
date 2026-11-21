import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Equity() {
  const supabase = createClient();
  const [{ data: owners }, { data: contributions }] = await Promise.all([
    supabase.from('owners').select('*').order('created_at'),
    supabase.from('capital_contributions').select('*, owners(full_name), entities(code)').order('contributed_at', { ascending: false }),
  ]);

  const paidByOwner = {};
  (contributions || []).forEach(c => {
    paidByOwner[c.owner_id] = (paidByOwner[c.owner_id] || 0) + Number(c.amount);
  });
  const totalPaid = Object.values(paidByOwner).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="topbar">
        <div><h1>Directors & equity</h1><div className="sub">Ownership, paid-in capital, and the profit waterfall</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Ownership structure</h3>
          {(owners || []).map(o => (
            <div className="owner" key={o.id}>
              <div className="av">{o.full_name.split(' ').map(w => w[0]).join('')}</div>
              <div className="inf">
                <div className="nm">{o.full_name}</div>
                <div className="rl">{o.role}</div>
              </div>
              <div className="eq">
                <div className="pc">{Number(o.ownership_pct)}%</div>
                <div className="cp">{fmt(paidByOwner[o.id] || 0)} paid in</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>
            Total paid-in capital: <b style={{ color: 'var(--text)' }}>{fmt(totalPaid)}</b>
          </div>
        </div>

        <div className="panel">
          <h3>Capital contribution history</h3>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Director</th><th>Entity</th><th>Tranche</th><th className="r">Amount</th></tr></thead>
            <tbody>
              {(contributions || []).map(c => (
                <tr key={c.id}>
                  <td>{c.contributed_at}</td>
                  <td>{c.owners?.full_name}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.entities?.code}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.tranche_label || '—'}</td>
                  <td className="r" style={{ color: 'var(--positive)' }}>{fmt(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
