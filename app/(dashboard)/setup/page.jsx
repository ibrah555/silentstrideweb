import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Setup({ searchParams }) {
  const supabase = createClient();
  const [{ data: owners }, { data: entities }, { data: agents }] = await Promise.all([
    supabase.from('owners').select('*').order('created_at'),
    supabase.from('entities').select('*').order('code'),
    supabase.from('agents').select('*, entities(code, name)').order('full_name'),
  ]);

  const activeEntities = (entities || []).filter(e => e.status === 'active');
  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>User Management & Setup</h1>
          <div className="sub">Create logins for Directors & Agents, add subsidiaries, and record capital directly</div>
        </div>
      </div>

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

      <div className="grid2">
        <div>
          {/* CREATE DIRECTOR / OWNER WITH LOGIN */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px' }}>Create Director / Shareholder Login</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)' }}>
              Creates their login credentials and registers full command center access.
            </p>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_owner" />
              <label className="f">Full name
                <input name="full_name" required placeholder="e.g. Ibrahim Director" />
              </label>
              <label className="f">Email address (Login Username)
                <input name="email" type="email" required placeholder="director@silentstrides.com" />
              </label>
              <label className="f">Temporary Password
                <input name="password" type="text" required minLength={6} placeholder="Minimum 6 characters" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="f">Role
                  <select name="role">
                    <option value="director">Director (Full Admin)</option>
                    <option value="shareholder">Shareholder</option>
                    <option value="investor">Investor</option>
                  </select>
                </label>
                <label className="f">Equity %
                  <input name="ownership_pct" type="number" step="0.01" min="0" max="100" defaultValue="50" required />
                </label>
              </div>
              <button className="btn gold" type="submit" style={{ marginTop: 6, justifyContent: 'center' }}>
                + Create Director Login
              </button>
            </form>
          </div>

          {/* RECORD CAPITAL */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px' }}>Record Capital Contribution</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)' }}>
              Injects director capital into an entity and credits the ledger automatically.
            </p>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_capital" />
              <label className="f">Owner
                <select name="owner_id" required>
                  {(owners || []).map(o => (
                    <option key={o.id} value={o.id}>{o.full_name} ({Number(o.ownership_pct)}%)</option>
                  ))}
                </select>
              </label>
              <label className="f">Destination Entity
                <select name="entity_id" required>
                  {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
                </select>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label className="f">Amount ($)
                  <input name="amount" type="number" step="0.01" min="0.01" required placeholder="50000" />
                </label>
                <label className="f">Tranche Label
                  <input name="tranche_label" placeholder="Seed / Tranche 1" />
                </label>
              </div>
              <label className="f">Contribution Date
                <input name="contributed_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
              </label>
              <button className="btn" type="submit" style={{ marginTop: 6, justifyContent: 'center' }}>
                Record Capital & Post to Ledger
              </button>
            </form>
          </div>

          {/* ACTIVE DIRECTORS LIST */}
          <div className="panel">
            <h3 style={{ margin: '0 0 10px' }}>Registered Directors & Owners</h3>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Equity</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {(owners || []).map(o => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 500 }}>{o.full_name}</td>
                    <td><span className="pill gold">{o.role}</span></td>
                    <td>{Number(o.ownership_pct)}%</td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{o.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {/* CREATE SALES AGENT WITH LOGIN */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px' }}>Create Sales Agent Login</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)' }}>
              Creates their login credentials for the dedicated Sales Agent Portal.
            </p>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_agent" />
              <label className="f">Full Name
                <input name="full_name" required placeholder="e.g. Sam Salesperson" />
              </label>
              <label className="f">Email (Agent Login Username)
                <input name="email" type="email" required placeholder="agent@silentstrides.com" />
              </label>
              <label className="f">Temporary Password
                <input name="password" type="text" required minLength={6} placeholder="Minimum 6 characters" />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <label className="f">Phone Number
                  <input name="phone" placeholder="+254 700 000000" />
                </label>
                <label className="f">Commission Rate
                  <input name="commission_rate" type="number" step="0.01" min="0" max="1" defaultValue="0.10" />
                </label>
              </div>
              <label className="f">Assign to Subsidiary
                <select name="entity_id" required>
                  {activeEntities.map(e => (
                    <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
                  ))}
                </select>
              </label>
              <label className="f">Account Status
                <select name="status">
                  <option value="active">Active (Can log in & submit sales)</option>
                  <option value="pending">Pending Agreement</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <label className="f" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <input type="checkbox" name="agreement_signed" value="1" defaultChecked style={{ width: 16, height: 16 }} />
                Sales agreement signed
              </label>
              <button className="btn gold" type="submit" style={{ marginTop: 6, justifyContent: 'center' }}>
                + Create Sales Agent Login
              </button>
            </form>
          </div>

          {/* ACTIVE AGENTS LIST */}
          <div className="panel" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 10px' }}>Registered Sales Agents</h3>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Subsidiary</th>
                  <th>Rate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(agents || []).map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.entities?.code}</td>
                    <td>{(Number(a.commission_rate) * 100).toFixed(0)}%</td>
                    <td>
                      <span className={'pill ' + (a.status === 'active' ? 'pos' : a.status === 'pending' ? 'gold' : 'gray')}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(agents || []).length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>
                      No sales agents registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ADD SUBSIDIARY */}
          <div className="panel">
            <h3 style={{ margin: '0 0 4px' }}>Add Subsidiary Entity</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--muted)' }}>
              Add a new business unit under the Silent Strides Network umbrella.
            </p>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_subsidiary" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                <label className="f">Code
                  <input name="code" required placeholder="SSN-AGRI" style={{ textTransform: 'uppercase' }} />
                </label>
                <label className="f">Entity Name
                  <input name="name" required placeholder="SSN Agri Trade Ltd" />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="f">Status
                  <select name="status">
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                  </select>
                </label>
                <label className="f">Default Comm. Rate
                  <input name="commission_rate" type="number" step="0.01" min="0" max="1" defaultValue="0.10" />
                </label>
              </div>
              <button className="btn" type="submit" style={{ marginTop: 6, justifyContent: 'center' }}>
                Add Subsidiary
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
