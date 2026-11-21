import { createClient } from '@/lib/supabase';
import { fmt } from '@/lib/format';
export const dynamic = 'force-dynamic';

export default async function Inventory({ searchParams }) {
  const supabase = createClient();
  const entityFilter = searchParams?.entity || null;

  const [{ data: items }, { data: entities }] = await Promise.all([
    supabase.from('inventory_items').select('*, entities(code, name)').order('name'),
    supabase.from('entities').select('id, code, name').eq('status', 'active').order('code'),
  ]);

  const filtered = (items || []).filter(i => !entityFilter || i.entity_id === entityFilter);
  const stockValue = filtered.reduce((a, i) => a + Number(i.qty_on_hand) * Number(i.unit_cost), 0);
  const lowStock = filtered.filter(i => i.qty_on_hand > 0 && i.qty_on_hand <= 5);

  return (
    <>
      <div className="topbar">
        <div><h1>Inventory</h1><div className="sub">Stock bought for resale — every unit costed and tracked</div></div>
        <form method="get" style={{ display: 'flex', gap: 8 }}>
          <select name="entity" defaultValue={entityFilter || ''} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}>
            <option value="">All entities</option>
            {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </select>
          <button className="btn" type="submit">Filter</button>
        </form>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 14 }}>
        <div className="kpi"><div className="l">Stock items</div><div className="v">{filtered.length}</div></div>
        <div className="kpi"><div className="l">Total stock value (cost)</div><div className="v">{fmt(stockValue)}</div></div>
        <div className="kpi"><div className="l">Low stock (≤ 5 units)</div><div className="v" style={{ color: lowStock.length ? 'var(--danger)' : 'var(--positive)' }}>{lowStock.length}</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <h3>Stock register</h3>
          <table className="tbl">
            <thead><tr><th>SKU</th><th>Item</th><th>Entity</th><th className="r">Cost</th><th className="r">Price</th><th className="r">On hand</th><th className="r">Stock value</th></tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.sku}</td>
                  <td style={{ fontWeight: 500 }}>{i.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{i.entities?.code}</td>
                  <td className="r">{fmt(i.unit_cost)}</td>
                  <td className="r">{fmt(i.unit_price)}</td>
                  <td className="r" style={{ fontWeight: 600, color: i.qty_on_hand <= 5 ? 'var(--danger)' : 'inherit' }}>{i.qty_on_hand}</td>
                  <td className="r">{fmt(Number(i.qty_on_hand) * Number(i.unit_cost))}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No items yet — add your first product below</td></tr>}
            </tbody>
          </table>
        </div>

        <div>
          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Add new item</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/inventory" method="post">
              <input type="hidden" name="action" value="add_item" />
              <label className="f">Subsidiary
                <select name="entity_id" required>{(entities || []).map(e => <option key={e.id} value={e.id}>{e.code}</option>)}</select>
              </label>
              <label className="f">SKU / code<input name="sku" required placeholder="PROD-001" /></label>
              <label className="f">Item name<input name="name" required /></label>
              <label className="f">Unit cost<input name="unit_cost" type="number" step="0.01" min="0" required /></label>
              <label className="f">Selling price<input name="unit_price" type="number" step="0.01" min="0" required /></label>
              <button className="btn gold" type="submit">Add item</button>
            </form>
          </div>

          <div className="panel" style={{ marginBottom: 14 }}>
            <h3>Stock in (purchase)</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/inventory" method="post">
              <input type="hidden" name="action" value="stock_in" />
              <label className="f">Item
                <select name="item_id" required>{filtered.map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>)}</select>
              </label>
              <label className="f">Quantity received<input name="qty" type="number" min="1" required /></label>
              <label className="f">Unit cost paid<input name="unit_cost" type="number" step="0.01" min="0" required /></label>
              <button className="btn" type="submit">Receive stock</button>
            </form>
          </div>

          <div className="panel">
            <h3>Stock count adjustment</h3>
            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/inventory" method="post">
              <input type="hidden" name="action" value="adjust" />
              <label className="f">Item
                <select name="item_id" required>{filtered.map(i => <option key={i.id} value={i.id}>{i.sku} — {i.name} ({i.qty_on_hand} on hand)</option>)}</select>
              </label>
              <label className="f">Counted quantity<input name="qty_on_hand" type="number" min="0" required /></label>
              <label className="f">Reason<input name="reason" placeholder="Damaged / lost / found" /></label>
              <button className="btn" type="submit">Adjust</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
