import { createClient } from '@/lib/supabase';
import DeleteButton from '@/components/DeleteButton';
import { fmt } from '@/lib/format';
export const dynamic = 'force-dynamic';

export default async function AgentsPage({ searchParams }) {
  const supabase = createClient();
  const editId = searchParams?.edit;

  const [{ data: agentBalances }, { data: allAgents }, { data: payments }, { data: entities }] = await Promise.all([
    supabase.from('v_agent_balances').select('*').order('full_name'),
    supabase.from('agents').select('*, entities(id, code, name)').order('created_at', { ascending: false }),
    supabase.from('commission_payments').select('*, agents(full_name)').order('paid_at', { ascending: false }).limit(15),
    supabase.from('entities').select('id, code, name').eq('status', 'active').order('code'),
  ]);

  const editAgent = editId ? allAgents?.find(a => a.id === editId) : null;
  const totalPayable = (agentBalances || []).reduce((a, x) => a + Number(x.payable || 0), 0);
  const totalEarned = (agentBalances || []).reduce((a, x) => a + Number(x.earned || 0), 0);

  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Sales Agents & Payouts</h1>
          <div className="sub">Manage sales agent logins, assign subsidiaries & commission rates, and execute payouts</div>
        </div>
      </div>

      {okMsg && (
        <div style={{ background: '#ECFDF5', color: 'var(--positive)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          ✓ {okMsg === 'paid' ? 'Commission payment recorded successfully.' : okMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="kpi" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="l">Total Commissions Payable</div>
          <div className="v" style={{ color: totalPayable > 0 ? 'var(--danger)' : 'var(--positive)' }}>{fmt(totalPayable)}</div>
          <div className="s">Owed to agents across all subsidiaries</div>
        </div>
        <div className="kpi">
          <div className="l">Total Commissions Earned</div>
          <div className="v">{fmt(totalEarned)}</div>
          <div className="s">All-time agent earnings</div>
        </div>
        <div className="kpi">
          <div className="l">Active Sales Agents</div>
          <div className="v">{(allAgents || []).filter(a => a.status === 'active').length}</div>
          <div className="s">Can log in & record sales</div>
        </div>
        <div className="kpi">
          <div className="l">Total Registered Roster</div>
          <div className="v">{allAgents?.length || 0}</div>
          <div className="s">Total agent accounts</div>
        </div>
      </div>

      {/* 2-COLUMN SECTION: CREATE/EDIT FORM + ROSTER */}
      <div className="grid2" style={{ gridTemplateColumns: '1.2fr 1.8fr', gap: 20, marginBottom: 24, alignItems: 'start' }}>
        
        {/* ADD OR EDIT AGENT FORM */}
        <div className="panel">
          <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>
            {editAgent ? `Edit: ${editAgent.full_name}` : 'Create New Sales Agent'}
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>
            {editAgent ? 'Update rate, subsidiary, or reset password.' : 'Creates their login credentials for the dedicated Sales Agent Portal.'}
          </p>

          <form action="/api/agents/manage" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="hidden" name="action" value={editAgent ? 'update' : 'create'} />
            {editAgent && <input type="hidden" name="id" value={editAgent.id} />}

            <label className="f">Full Name
              <input name="full_name" required defaultValue={editAgent?.full_name || ''} placeholder="e.g. Sam Otieno" />
            </label>

            <label className="f">Email (Login Username)
              <input
                name="email"
                type="email"
                required
                readOnly={!!editAgent}
                defaultValue={editAgent?.email || ''}
                placeholder="agent@silentstrides.com"
                style={editAgent ? { background: '#F1EFEA', cursor: 'not-allowed' } : {}}
              />
            </label>

            <label className="f">
              {editAgent ? 'Reset Password (leave empty to keep current)' : 'Temporary Password'}
              <input
                name={editAgent ? 'new_password' : 'password'}
                type="text"
                minLength={6}
                required={!editAgent}
                placeholder="Minimum 6 characters"
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <label className="f">Phone Number
                <input name="phone" defaultValue={editAgent?.phone || ''} placeholder="+254 700 000000" />
              </label>

              <label className="f">Commission Rate
                <input
                  name="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                  defaultValue={editAgent ? Number(editAgent.commission_rate) : 0.10}
                />
              </label>
            </div>

            <label className="f">Assign to Subsidiary
              <select name="entity_id" required defaultValue={editAgent?.entity_id || ''}>
                {(entities || []).map(e => (
                  <option key={e.id} value={e.id}>{e.code} — {e.name}</option>
                ))}
              </select>
            </label>

            <label className="f">Status
              <select name="status" defaultValue={editAgent?.status || 'active'}>
                <option value="active">Active (Can log in & record sales)</option>
                <option value="pending">Pending Agreement</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>

            {!editAgent && (
              <label className="f" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: '4px 0' }}>
                <input type="checkbox" name="agreement_signed" value="1" defaultChecked style={{ width: 16, height: 16 }} />
                Sales agreement signed
              </label>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn gold" type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                {editAgent ? 'Save Changes' : '+ Create Sales Agent Login'}
              </button>
              {editAgent && (
                <a href="/agents" className="btn" style={{ background: '#ECEAE4', color: 'var(--text)', textDecoration: 'none' }}>
                  Cancel
                </a>
              )}
            </div>
          </form>
        </div>

        {/* AGENTS ROSTER WITH EDIT & DELETE */}
        <div className="panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Agent Roster & Accounts</h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Subsidiary</th>
                  <th>Rate</th>
                  <th>Status</th>
                  <th className="r">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(allAgents || []).map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.email || 'No email'} · {a.phone || 'No phone'}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{a.entities?.code}</td>
                    <td style={{ fontWeight: 500 }}>{(Number(a.commission_rate) * 100).toFixed(0)}%</td>
                    <td>
                      <span className={'pill ' + (a.status === 'active' ? 'pos' : a.status === 'pending' ? 'gold' : 'gray')}>
                        {a.status}
                      </span>
                    </td>
                    <td className="r">
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <a
                          href={`/contract/${a.id}`}
                          className="btn"
                          title="View, sign, or print official agency agreement"
                          style={{
                            padding: '3px 8px',
                            fontSize: 11,
                            textDecoration: 'none',
                            background: a.agreement_signed_at ? '#DCFCE7' : '#EFF6FF',
                            color: a.agreement_signed_at ? '#15803D' : '#1D4ED8',
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: a.agreement_signed_at ? '#BBF7D0' : '#BFDBFE'
                          }}
                        >
                          📄 {a.agreement_signed_at ? 'Contract (Signed)' : 'Contract'}
                        </a>
                        <a href={`/agents?edit=${a.id}`} className="btn" style={{ padding: '3px 8px', fontSize: 11, textDecoration: 'none', background: '#ECEAE4', color: 'var(--text)' }}>
                          Edit
                        </a>
                        <form action="/api/agents/manage" method="post" style={{ display: 'inline', margin: 0 }}>
                          <input type="hidden" name="action" value="delete" />
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="email" value={a.email} />
                          <DeleteButton confirmText={`Delete agent ${a.full_name}?`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {(allAgents || []).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                      No agents created yet. Add your first sales agent on the left.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* BALANCES & PAYOUTS SECTION */}
      <div className="grid2" style={{ gridTemplateColumns: '1.4fr 1.6fr', gap: 20 }}>
        
        {/* PAYOUT EXECUTION TABLE */}
        <div className="panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Commission Balances & Instant Payout</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Agent</th>
                <th className="r">Earned</th>
                <th className="r">Paid</th>
                <th className="r">Payable</th>
                <th className="r">Pay Now</th>
              </tr>
            </thead>
            <tbody>
              {(agentBalances || []).map(a => {
                const payable = Number(a.payable || 0);
                return (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500 }}>{a.full_name}</td>
                    <td className="r">{fmt(a.earned)}</td>
                    <td className="r">{fmt(a.paid)}</td>
                    <td className="r" style={{ fontWeight: 600, color: payable > 0 ? 'var(--danger)' : 'var(--positive)' }}>{fmt(payable)}</td>
                    <td className="r">
                      {payable > 0 ? (
                        <form action="/api/commissions/pay" method="post" style={{ display: 'inline-flex', gap: 6, margin: 0 }}>
                          <input type="hidden" name="agent_id" value={a.id} />
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={payable}
                            defaultValue={payable.toFixed(2)}
                            style={{ width: 85, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                            required
                          />
                          <button className="btn gold" type="submit" style={{ padding: '4px 10px', fontSize: 12 }}>
                            Pay
                          </button>
                        </form>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>Paid up</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* RECENT COMMISSION PAYMENTS HISTORY */}
        <div className="panel">
          <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Recent Commission Payout History</h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Agent</th>
                <th className="r">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              {(payments || []).map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.paid_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{p.agents?.full_name || 'Agent'}</td>
                  <td className="r" style={{ color: 'var(--danger)', fontWeight: 600 }}>{fmt(p.amount)}</td>
                </tr>
              ))}
              {(payments || []).length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                    No commission payouts executed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
