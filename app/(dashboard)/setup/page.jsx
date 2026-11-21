import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Setup() {
  const supabase = createClient();
  const [{ data: owners }, { data: entities }, { data: agents }] = await Promise.all([
    supabase.from('owners').select('*').order('created_at'),
    supabase.from('entities').select('*').order('code'),
    supabase.from('agents').select('id, full_name').order('full_name'),
  ]);

  const activeEntities = (entities || []).filter(e => e.status === 'active');

  return (
    <>
      <div className="topbar">
        <div><h1>Setup & administration</h1><div className="sub">Add directors, agents, subsidiaries, and record capital — no SQL needed</div></div>
      </div>

      <div className="grid2">
        <div>
          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Add a director / shareholder</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_owner" />
              <label className="f">Full name<input name="full_name" required /></label>
              <label className="f">Email<input name="email" type="email" required /></label>
              <label className="f">Role
                <select name="role">
                  <option value="director">Director</option>
                  <option value="shareholder">Shareholder</option>
                  <option value="investor">Investor</option>
                </select>
              </label>
              <label className="f">Ownership %<input name="ownership_pct" type="number" step="0.01" min="0" max="100" required /></label>
              <button className="btn gold" type="submit">Add owner</button>
            </form>
          </div>

          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Record capital contribution</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_capital" />
              <label className="f">Owner
                <select name="owner_id" required>{(owners || []).map(o => <option key={o.id} value={o.id}>{o.full_name} ({Number(o.ownership_pct)}%)</option>)}</select>
              </label>
              <label className="f">Into entity
                <select name="entity_id" required>{(entities || []).map(e => <option key={e.id} value={e.id}>{e.code}</option>)}</select>
              </label>
              <label className="f">Amount<input name="amount" type="number" step="0.01" min="0.01" required /></label>
              <label className="f">Tranche label<input name="tranche_label" placeholder="Tranche 2" /></label>
              <label className="f">Date<input name="contributed_at" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <button className="btn" type="submit">Record capital</button>
            </form>
          </div>
        </div>

        <div>
          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Add a sales agent</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_agent" />
              <label className="f">Full name<input name="full_name" required /></label>
              <label className="f">Phone<input name="phone" /></label>
              <label className="f">Email<input name="email" type="email" /></label>
              <label className="f">Sells for
                <select name="entity_id" required>{activeEntities.map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}</select>
              </label>
              <label className="f">Commission rate (decimal)<input name="commission_rate" type="number" step="0.01" min="0" max="1" defaultValue="0.10" /></label>
              <label className="f">Status
                <select name="status">
                  <option value="pending">Pending (agreement not signed)</option>
                  <option value="active">Active (agreement signed)</option>
                </select>
              </label>
              <label className="f" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" name="agreement_signed" value="1" style={{ width: 16, height: 16 }} />
                Sales agreement signed
              </label>
              <button className="btn gold" type="submit">Add agent</button>
            </form>
          </div>

          <div className="panel">
            <h3>Add a subsidiary</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/setup" method="post">
              <input type="hidden" name="action" value="add_subsidiary" />
              <label className="f">Code<input name="code" required placeholder="SSN-AGRI" style={{ textTransform: 'uppercase' }} /></label>
              <label className="f">Name<input name="name" required placeholder="SSN Agri Trade" /></label>
              <label className="f">Status
                <select name="status">
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                </select>
              </label>
              <label className="f">Default commission rate<input name="commission_rate" type="number" step="0.01" min="0" max="1" defaultValue="0.10" /></label>
              <button className="btn" type="submit">Add subsidiary</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
