import { createClient } from '@/lib/supabase';

const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dynamic = 'force-dynamic';

export default async function Ledger({ searchParams }) {
  const supabase = createClient();
  const entityFilter = searchParams?.entity || null;

  let query = supabase.from('ledger_entries')
    .select('*, entities(code, name)')
    .order('entry_date', { ascending: false })
    .limit(200);
  if (entityFilter) query = query.eq('entity_id', entityFilter);

  const [{ data: entries }, { data: entities }] = await Promise.all([
    query,
    supabase.from('entities').select('id, code, name').order('code'),
  ]);

  return (
    <>
      <div className="topbar">
        <div><h1>The penny ledger</h1><div className="sub">Append-only double entry — nothing exists unless it passes through here</div></div>
        <form method="get" style={{ display: 'flex', gap: 8 }}>
          <select name="entity" defaultValue={entityFilter || ''} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}>
            <option value="">All entities</option>
            {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </select>
          <button className="btn" type="submit">Filter</button>
        </form>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Entity</th><th>Account</th><th className="r">Debit</th><th className="r">Credit</th><th>Memo</th></tr></thead>
          <tbody>
            {(entries || []).map(e => (
              <tr key={e.id}>
                <td>{e.entry_date}</td>
                <td>{e.entities?.code}</td>
                <td style={{ color: 'var(--muted)' }}>{e.account.replace(/_/g, ' ')}</td>
                <td className="r" style={{ color: e.debit > 0 ? 'var(--danger)' : 'inherit' }}>{e.debit > 0 ? fmt(e.debit) : ''}</td>
                <td className="r" style={{ color: e.credit > 0 ? 'var(--positive)' : 'inherit' }}>{e.credit > 0 ? fmt(e.credit) : ''}</td>
                <td style={{ color: 'var(--muted)', fontSize: 13 }}>{e.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
