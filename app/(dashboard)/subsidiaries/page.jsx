import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = n => n >= 1e3 ? '$' + (n / 1e3).toFixed(1) + 'K' : fmt(n);
export const dynamic = 'force-dynamic';

export default async function SubsidiariesPage({ searchParams }) {
  const supabase = createClient();
  const editId = searchParams?.edit;

  const [{ data: pnl }, { data: entities }] = await Promise.all([
    supabase.from('v_subsidiary_pnl').select('*'),
    supabase.from('entities').select('*').order('code'),
  ]);

  const pnlMap = Object.fromEntries((pnl || []).map(p => [p.id, p]));
  const editEntity = editId ? entities?.find(e => e.id === editId) : null;

  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Subsidiaries & Business Units</h1>
          <div className="sub">Manage subsidiaries, configure commission structures, and review individual entity P&L</div>
        </div>
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

      {/* 2-COLUMN: ADD/EDIT FORM + SUBSIDIARIES DIRECTORY TABLE */}
      <div className="grid2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>
        
        {/* ADD OR EDIT FORM */}
        <div className="panel">
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            {editEntity ? `Edit: ${editEntity.name}` : 'Add New Subsidiary'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            {editEntity ? 'Update business unit details and commission rates.' : 'Register a new operating subsidiary under the network.'}
          </p>

          <form action="/api/subsidiaries" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="action" value={editEntity ? 'update' : 'create'} />
            {editEntity && <input type="hidden" name="id" value={editEntity.id} />}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <label className="f">Entity Code
                <input
                  name="code"
                  required
                  readOnly={!!editEntity}
                  defaultValue={editEntity?.code || ''}
                  placeholder="SSN-AGRI"
                  style={{ textTransform: 'uppercase', ...(editEntity ? { background: '#F1EFEA', cursor: 'not-allowed' } : {}) }}
                />
              </label>

              <label className="f">Subsidiary Full Name
                <input
                  name="name"
                  required
                  defaultValue={editEntity?.name || ''}
                  placeholder="e.g. SSN Agriculture Ltd"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="f">Status
                <select name="status" defaultValue={editEntity?.status || 'active'}>
                  <option value="active">Active</option>
                  <option value="planned">Planned</option>
                  <option value="dormant">Dormant</option>
                </select>
              </label>

              <label className="f">Default Comm. Rate
                <input
                  name="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                  defaultValue={editEntity ? Number(editEntity.commission_rate) : 0.10}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn gold" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                {editEntity ? 'Save Changes' : '+ Add Subsidiary'}
              </button>
              {editEntity && (
                <a href="/subsidiaries" className="btn" style={{ background: '#ECEAE4', color: 'var(--text)', textDecoration: 'none' }}>
                  Cancel
                </a>
              )}
            </div>
          </form>
        </div>

        {/* SUBSIDIARY DIRECTORY TABLE */}
        <div className="panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Subsidiary Directory</h3>

          <table className="tbl">
            <thead>
              <tr>
                <th>Entity</th>
                <th>Kind</th>
                <th>Comm. Rate</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(entities || []).map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{e.code}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{e.kind}</td>
                  <td>{(Number(e.commission_rate) * 100).toFixed(0)}%</td>
                  <td>
                    <span className={'pill ' + (e.status === 'active' ? 'pos' : e.status === 'planned' ? 'gold' : 'gray')}>
                      {e.status}
                    </span>
                  </td>
                  <td className="r">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <a href={`/subsidiaries?edit=${e.id}`} className="btn" style={{ padding: '3px 8px', fontSize: 11, textDecoration: 'none', background: '#ECEAE4', color: 'var(--text)' }}>
                        Edit
                      </a>

                      {e.kind !== 'holding' && (
                        <form action="/api/subsidiaries" method="post" style={{ display: 'inline', margin: 0 }}>
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="btn"
                            style={{ padding: '3px 8px', fontSize: 11, background: '#FEE2E2', color: 'var(--danger)' }}
                            onClick={(ev) => {
                              if (!confirm(`Delete or archive ${e.name}?`)) ev.preventDefault();
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* FINANCIAL P&L OVERVIEW BY SUBSIDIARY */}
      <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Subsidiary Profit & Loss Books</h3>
      
      {(entities || []).filter(e => e.kind === 'subsidiary').map(e => {
        const p = pnlMap[e.id] || {};
        const net = Number(p.net_profit || 0);
        return (
          <div className="panel" key={e.id} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: e.status === 'active' ? 'var(--navy)' : 'var(--border)',
                color: e.status === 'active' ? 'var(--gold)' : 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13
              }}>
                {e.code.replace('SSN-', '').slice(0, 3)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{e.code} · default commission {(Number(e.commission_rate) * 100).toFixed(1)}%</div>
              </div>
              <span className={'pill ' + (e.status === 'active' ? 'gold' : 'gray')}>{e.status}</span>
            </div>

            <div className="kpis" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 0 }}>
              <div className="kpi"><div className="l">Revenue</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.revenue || 0))}</div></div>
              <div className="kpi"><div className="l">Cost of Goods</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.cogs || 0))}</div></div>
              <div className="kpi"><div className="l">Commissions</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.commissions || 0))}</div></div>
              <div className="kpi"><div className="l">Opex</div><div className="v" style={{ fontSize: 20 }}>{fmtK(Number(p.opex || 0))}</div></div>
              <div className="kpi">
                <div className="l">Net P/L</div>
                <div className="v" style={{ fontSize: 20, color: net > 0 ? 'var(--positive)' : net < 0 ? 'var(--danger)' : 'inherit' }}>
                  {fmtK(net)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
