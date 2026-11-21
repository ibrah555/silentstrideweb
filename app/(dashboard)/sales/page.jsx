import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Sales() {
  const supabase = createClient();
  const [{ data: sales }, { data: agents }, { data: entities }] = await Promise.all([
    supabase.from('sales').select('*, agents(full_name), entities(code)').order('sold_at', { ascending: false }).limit(50),
    supabase.from('agents').select('id, full_name').eq('status', 'active').order('full_name'),
    supabase.from('entities').select('id, code, name').eq('status', 'active').order('code'),
  ]);

  return (
    <>
      <div className="topbar">
        <div><h1>Sales & commissions</h1><div className="sub">Record a sale — commission accrues to the agent automatically</div></div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <h3>Record a sale</h3>
        <form className="form" action="/api/sales" method="post">
          <label className="f">Subsidiary
            <select name="entity_id" required>
              {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
            </select>
          </label>
          <label className="f">Agent (optional — commission applies)
            <select name="agent_id">
              <option value="">No agent (direct sale)</option>
              {(agents || []).map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          </label>
          <label className="f">Batch / reference
            <input name="batch_label" placeholder="Batch #115" />
          </label>
          <label className="f">Sale amount
            <input name="total_amount" type="number" step="0.01" min="0" required />
          </label>
          <label className="f">Cost of goods for this sale
            <input name="cogs_amount" type="number" step="0.01" min="0" defaultValue="0" />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn gold" type="submit">Record sale</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <h3>Recent sales</h3>
        <table className="tbl">
          <thead><tr><th>Date</th><th>Batch</th><th>Entity</th><th>Agent</th><th className="r">Amount</th><th className="r">Commission</th><th className="r">Net to company</th></tr></thead>
          <tbody>
            {(sales || []).map(s => (
              <tr key={s.id}>
                <td>{new Date(s.sold_at).toLocaleDateString()}</td>
                <td>{s.batch_label || '—'}</td>
                <td>{s.entities?.code}</td>
                <td>{s.agents?.full_name || <span style={{ color: 'var(--muted)' }}>Direct</span>}</td>
                <td className="r">{fmt(s.total_amount)}</td>
                <td className="r" style={{ color: 'var(--danger)' }}>{s.commission_amount > 0 ? fmt(s.commission_amount) : '—'}</td>
                <td className="r" style={{ fontWeight: 500 }}>{fmt(Number(s.total_amount) - Number(s.commission_amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
