import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function EquityPage({ searchParams }) {
  const supabase = createClient();
  const [{ data: owners }, { data: contributions }, { data: entities }] = await Promise.all([
    supabase.from('owners').select('*').order('created_at'),
    supabase.from('capital_contributions').select('*, owners(full_name), entities(code, name)').order('contributed_at', { ascending: false }),
    supabase.from('entities').select('id, code, name').order('code'),
  ]);

  const paidByOwner = {};
  (contributions || []).forEach(c => {
    paidByOwner[c.owner_id] = (paidByOwner[c.owner_id] || 0) + Number(c.amount);
  });
  const totalPaid = Object.values(paidByOwner).reduce((a, b) => a + b, 0);

  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Directors Equity & Capital</h1>
          <div className="sub">Ownership shares, paid-in capital injections, and the double-entry equity waterfall</div>
        </div>
        <Link href="/directors" className="btn gold" style={{ fontSize: 13, textDecoration: 'none' }}>
          Manage Directors & Logins ➔
        </Link>
      </div>

      {okMsg && (
        <div style={{ background: '#ECFDF5', color: 'var(--positive)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          ✓ {okMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* KPI METRICS */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="l">Total Paid-In Capital</div>
          <div className="v" style={{ color: 'var(--positive)' }}>{fmt(totalPaid)}</div>
          <div className="s">Cumulative cash injections</div>
        </div>
        <div className="kpi">
          <div className="l">Registered Directors</div>
          <div className="v">{owners?.length || 0}</div>
          <div className="s">Holding company shareholders</div>
        </div>
        <div className="kpi">
          <div className="l">Capital Contributions</div>
          <div className="v">{contributions?.length || 0}</div>
          <div className="s">Completed tranche entries</div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: RECORD CAPITAL FORM + OWNERSHIP STRUCTURE */}
      <div className="grid2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>
        
        {/* RECORD CAPITAL FORM */}
        <div className="panel">
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>Record Capital Contribution</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            Injects cash into a subsidiary and credits the double-entry ledger automatically.
          </p>

          <form action="/api/equity" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="action" value="add_capital" />

            <label className="f">Contributing Director
              <select name="owner_id" required>
                {(owners || []).map(o => (
                  <option key={o.id} value={o.id}>{o.full_name} ({Number(o.ownership_pct)}% Equity)</option>
                ))}
              </select>
            </label>

            <label className="f">Destination Entity
              <select name="entity_id" required>
                {(entities || []).map(e => (
                  <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
                ))}
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <label className="f">Amount ($)
                <input name="amount" type="number" step="0.01" min="0.01" required placeholder="50000.00" />
              </label>

              <label className="f">Tranche / Memo
                <input name="tranche_label" placeholder="Seed, Tranche 2" />
              </label>
            </div>

            <label className="f">Date
              <input name="contributed_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </label>

            <button className="btn gold" type="submit" style={{ marginTop: 6, justifyContent: 'center' }}>
              + Record Capital & Post to Ledger
            </button>
          </form>
        </div>

        {/* OWNERSHIP STRUCTURE CARDS */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Ownership Structure</h3>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total Equity: 100%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(owners || []).map(o => {
              const paid = paidByOwner[o.id] || 0;
              const pct = Number(o.ownership_pct);
              return (
                <div className="owner" key={o.id} style={{ padding: '12px 14px', background: '#FAF9F5', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="av" style={{ background: 'var(--navy)', color: 'var(--gold)' }}>
                    {o.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="inf" style={{ flex: 1 }}>
                    <div className="nm" style={{ fontWeight: 600 }}>{o.full_name}</div>
                    <div className="rl" style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>
                      {o.role} · {o.email}
                    </div>
                  </div>
                  <div className="eq" style={{ textAlign: 'right' }}>
                    <div className="pc" style={{ fontWeight: 700, fontSize: 16 }}>{pct}%</div>
                    <div className="cp" style={{ fontSize: 12, color: 'var(--positive)', fontWeight: 500 }}>
                      {fmt(paid)} paid in
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CONTRIBUTION HISTORY TABLE WITH DELETE / REVERSE */}
      <div className="panel">
        <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Capital Contribution Ledger History</h3>

        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Director</th>
              <th>Entity</th>
              <th>Tranche / Memo</th>
              <th className="r">Amount Paid In</th>
              <th className="r">Action</th>
            </tr>
          </thead>
          <tbody>
            {(contributions || []).map(c => (
              <tr key={c.id}>
                <td>{c.contributed_at}</td>
                <td style={{ fontWeight: 500 }}>{c.owners?.full_name}</td>
                <td style={{ color: 'var(--muted)' }}>{c.entities?.code}</td>
                <td style={{ color: 'var(--muted)' }}>{c.tranche_label || '—'}</td>
                <td className="r" style={{ color: 'var(--positive)', fontWeight: 600 }}>{fmt(c.amount)}</td>
                <td className="r">
                  <form action="/api/equity" method="post" style={{ display: 'inline', margin: 0 }}>
                    <input type="hidden" name="action" value="delete_capital" />
                    <input type="hidden" name="id" value={c.id} />
                    <DeleteButton confirmText={`Reverse capital contribution of ${fmt(c.amount)}? Matching ledger entries will be deleted.`} />
                  </form>
                </td>
              </tr>
            ))}
            {(contributions || []).length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  No capital contributions recorded yet. Record your first injection above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
