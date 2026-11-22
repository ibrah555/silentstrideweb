import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import DeleteButton from '@/components/DeleteButton';
import { fmt } from '@/lib/format';
export const dynamic = 'force-dynamic';

export default async function Inventory({ searchParams }) {
  const supabase = createClient();
  const entityFilter = searchParams?.entity || null;
  const editId = searchParams?.edit || null;

  const [{ data: items }, { data: entities }] = await Promise.all([
    supabase.from('inventory_items').select('*, entities(code, name)').order('name'),
    supabase.from('entities').select('id, code, name').eq('status', 'active').order('code'),
  ]);

  const editItem = editId ? items?.find(i => i.id === editId) : null;
  const filtered = (items || []).filter(i => !entityFilter || i.entity_id === entityFilter);
  const stockValue = filtered.reduce((a, i) => a + Number(i.qty_on_hand) * Number(i.unit_cost), 0);
  const lowStock = filtered.filter(i => i.qty_on_hand > 0 && i.qty_on_hand <= 5);

  const okMsg = searchParams?.ok;
  const errorMsg = searchParams?.error;

  const getOkText = (code) => {
    switch (code) {
      case 'item_added': return 'Product item added successfully.';
      case 'item_updated': return 'Product details updated successfully.';
      case 'item_deleted': return 'Product item deleted successfully.';
      case 'stock_in': return 'Stock receipt and cost recorded successfully.';
      case 'adjusted': return 'Stock count adjustment recorded successfully.';
      default: return code;
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Inventory & Products</h1>
          <div className="sub">Stock bought for resale — configure products, edit prices, and track warehouse stock</div>
        </div>
        <form method="get" style={{ display: 'flex', gap: 8 }}>
          <select name="entity" defaultValue={entityFilter || ''} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }}>
            <option value="">All entities</option>
            {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </select>
          <button className="btn" type="submit">Filter</button>
        </form>
      </div>

      {okMsg && (
        <div style={{ background: '#ECFDF5', color: 'var(--positive)', border: '1px solid #A7F3D0', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
          ✓ {getOkText(okMsg)}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
          ⚠ {errorMsg}
        </div>
      )}

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 14 }}>
        <div className="kpi"><div className="l">Stock items</div><div className="v">{filtered.length}</div></div>
        <div className="kpi"><div className="l">Total stock value (cost)</div><div className="v">{fmt(stockValue)}</div></div>
        <div className="kpi"><div className="l">Low stock (≤ 5 units)</div><div className="v" style={{ color: lowStock.length ? 'var(--danger)' : 'var(--positive)' }}>{lowStock.length}</div></div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0 }}>Stock register</h3>
            {editItem && (
              <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                Editing: {editItem.name}
              </span>
            )}
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th>Entity</th>
                <th className="r">Cost</th>
                <th className="r">Price</th>
                <th className="r">On hand</th>
                <th className="r">Stock value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const isCurrentEdit = editId === i.id;
                return (
                  <tr key={i.id} style={{ background: isCurrentEdit ? '#F3EBDC' : 'transparent' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.sku}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{i.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{i.entities?.code}</td>
                    <td className="r">{fmt(i.unit_cost)}</td>
                    <td className="r" style={{ fontWeight: 600 }}>{fmt(i.unit_price)}</td>
                    <td className="r" style={{ fontWeight: 600, color: i.qty_on_hand <= 5 ? 'var(--danger)' : 'inherit' }}>
                      {i.qty_on_hand}
                    </td>
                    <td className="r">{fmt(Number(i.qty_on_hand) * Number(i.unit_cost))}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                        <Link
                          href={`/inventory?edit=${i.id}${entityFilter ? `&entity=${entityFilter}` : ''}`}
                          className="btn"
                          style={{
                            padding: '3px 8px',
                            fontSize: 11,
                            background: isCurrentEdit ? 'var(--gold)' : '#F7F6F2',
                            color: isCurrentEdit ? 'var(--navy)' : 'var(--text)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none'
                          }}
                        >
                          {isCurrentEdit ? 'Editing' : 'Edit'}
                        </Link>
                        <form action="/api/inventory" method="post" style={{ margin: 0 }}>
                          <input type="hidden" name="action" value="delete_item" />
                          <input type="hidden" name="id" value={i.id} />
                          <DeleteButton confirmText={`Are you sure you want to delete ${i.name} (${i.sku})?`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                    No items yet — add your first product below
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          {/* ADD OR EDIT PRODUCT PANEL */}
          <div className="panel" style={{ marginBottom: 14, border: editItem ? '2px solid var(--gold)' : '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>
                {editItem ? `Edit Product: ${editItem.name}` : 'Add new item'}
              </h3>
              {editItem && (
                <Link
                  href={`/inventory${entityFilter ? `?entity=${entityFilter}` : ''}`}
                  style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'underline' }}
                >
                  Cancel Edit
                </Link>
              )}
            </div>

            <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--muted)' }}>
              {editItem
                ? 'Update product pricing, item title, SKU code, or subsidiary assignment.'
                : 'Define a new product item in the catalog.'}
            </p>

            <form className="form" style={{ gridTemplateColumns: '1fr' }} action="/api/inventory" method="post">
              <input type="hidden" name="action" value={editItem ? 'edit_item' : 'add_item'} />
              {editItem && <input type="hidden" name="id" value={editItem.id} />}

              <label className="f">Subsidiary
                <select name="entity_id" defaultValue={editItem?.entity_id || ''} required>
                  {(entities || []).map(e => <option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
                </select>
              </label>

              <label className="f">SKU / code
                <input name="sku" defaultValue={editItem?.sku || ''} required placeholder="PROD-001" />
              </label>

              <label className="f">Item name
                <input name="name" defaultValue={editItem?.name || ''} required placeholder="e.g. Pure Honey 500g" />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label className="f">Unit cost (KSh)
                  <input name="unit_cost" type="number" step="0.01" min="0" defaultValue={editItem?.unit_cost || ''} required />
                </label>
                <label className="f">Selling price (KSh)
                  <input name="unit_price" type="number" step="0.01" min="0" defaultValue={editItem?.unit_price || ''} required />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className={`btn ${editItem ? 'gold' : 'gold'}`} type="submit" style={{ flex: 1, justifyContent: 'center' }}>
                  {editItem ? 'Save Product Changes' : 'Add item'}
                </button>
                {editItem && (
                  <Link
                    href={`/inventory${entityFilter ? `?entity=${entityFilter}` : ''}`}
                    className="btn"
                    style={{ background: '#F7F6F2', color: 'var(--text)', border: '1px solid var(--border)', textDecoration: 'none' }}
                  >
                    Cancel
                  </Link>
                )}
              </div>
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
              <label className="f">Unit cost paid (KSh)<input name="unit_cost" type="number" step="0.01" min="0" required /></label>
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
