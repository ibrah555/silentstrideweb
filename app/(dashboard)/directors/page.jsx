import { createClient } from '@/lib/supabase';
import { getCurrentUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DirectorsPage({ searchParams }) {
  const supabase = createClient();
  const auth = await getCurrentUserRole();

  const { data: owners } = await supabase.from('owners').select('*').order('created_at', { ascending: true });

  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;
  const editId = searchParams?.edit;
  const editOwner = editId ? owners?.find(o => o.id === editId) : null;

  const totalEquity = (owners || []).reduce((acc, o) => acc + Number(o.ownership_pct || 0), 0);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Directors & User Access</h1>
          <div className="sub">Manage company directors, shareholders, and administrative login credentials</div>
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

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="kpi">
          <div className="l">Total Directors / Owners</div>
          <div className="v">{owners?.length || 0}</div>
          <div className="s">Registered administrators</div>
        </div>
        <div className="kpi">
          <div className="l">Allocated Equity</div>
          <div className="v" style={{ color: totalEquity === 100 ? 'var(--positive)' : 'var(--gold)' }}>{totalEquity}%</div>
          <div className="s">{totalEquity === 100 ? 'Fully allocated (100%)' : `${100 - totalEquity}% remaining`}</div>
        </div>
        <div className="kpi">
          <div className="l">My Account</div>
          <div className="v" style={{ fontSize: 18, fontWeight: 600 }}>{auth?.profile?.full_name || auth?.user?.email}</div>
          <div className="s">Active Director session</div>
        </div>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: editOwner ? '1.4fr 1.6fr' : '1.3fr 1.7fr', gap: 20, alignItems: 'start' }}>
        
        {/* CREATE OR EDIT FORM */}
        <div className="panel">
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            {editOwner ? `Edit: ${editOwner.full_name}` : 'Add New Director'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            {editOwner ? 'Update director role, equity share, or reset login password.' : 'Creates their confirmed login credentials and grants Command Center access.'}
          </p>

          <form action="/api/directors" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="action" value={editOwner ? 'update' : 'create'} />
            {editOwner && <input type="hidden" name="id" value={editOwner.id} />}

            <label className="f">Full Name
              <input name="full_name" required defaultValue={editOwner?.full_name || ''} placeholder="e.g. Director Name" />
            </label>

            <label className="f">Email Address (Login Username)
              <input
                name="email"
                type="email"
                required
                readOnly={!!editOwner}
                defaultValue={editOwner?.email || ''}
                placeholder="director@silentstrides.com"
                style={editOwner ? { background: '#F1EFEA', cursor: 'not-allowed' } : {}}
              />
            </label>

            <label className="f">
              {editOwner ? 'Reset Password (leave empty to keep current)' : 'Temporary Password'}
              <input
                name={editOwner ? 'new_password' : 'password'}
                type="text"
                minLength={6}
                required={!editOwner}
                placeholder="Minimum 6 characters"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <label className="f">Role
                <select name="role" defaultValue={editOwner?.role || 'director'}>
                  <option value="director">Director</option>
                  <option value="shareholder">Shareholder</option>
                  <option value="investor">Investor</option>
                </select>
              </label>

              <label className="f">Equity %
                <input
                  name="ownership_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  defaultValue={editOwner ? Number(editOwner.ownership_pct) : 50}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn gold" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                {editOwner ? 'Save Changes' : '+ Create Director Login'}
              </button>
              {editOwner && (
                <a href="/directors" className="btn" style={{ background: '#ECEAE4', color: 'var(--text)', textDecoration: 'none' }}>
                  Cancel
                </a>
              )}
            </div>
          </form>
        </div>

        {/* DIRECTORS LIST TABLE */}
        <div className="panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Registered Directors & Users</h3>

          <table className="tbl">
            <thead>
              <tr>
                <th>Director</th>
                <th>Role</th>
                <th>Equity</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(owners || []).map(o => {
                const isCurrent = o.email?.toLowerCase() === auth?.user?.email?.toLowerCase();
                return (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{o.email}</div>
                    </td>
                    <td>
                      <span className="pill gold">{o.role}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{Number(o.ownership_pct)}%</td>
                    <td className="r">
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <a href={`/directors?edit=${o.id}`} className="btn" style={{ padding: '3px 8px', fontSize: 11, textDecoration: 'none', background: '#ECEAE4', color: 'var(--text)' }}>
                          Edit
                        </a>

                        {!isCurrent && (
                          <form action="/api/directors" method="post" style={{ display: 'inline', margin: 0 }}>
                            <input type="hidden" name="action" value="delete" />
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="email" value={o.email} />
                            <button
                              type="submit"
                              className="btn"
                              style={{ padding: '3px 8px', fontSize: 11, background: '#FEE2E2', color: 'var(--danger)' }}
                              onClick={(e) => {
                                if (!confirm(`Delete ${o.full_name}? This permanently removes their account.`)) e.preventDefault();
                              }}
                            >
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
