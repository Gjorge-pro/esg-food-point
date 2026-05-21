import { useState } from 'react';
import { Panel } from '../../../components/Panel';
import useInventory from '../../../hooks/useInventory';

export function InventoryManagementPanel({ menuItems = [], notify }) {
  const { inventory, lowStockItems, loading, error, saveInventoryItem } = useInventory();
  const [form, setForm] = useState({
    menu_item_id: '',
    stock_quantity: '',
    unit: 'pcs',
    low_stock_threshold: '5',
    prevent_order_when_empty: false,
  });

  const submit = async (event) => {
    event.preventDefault();

    const result = await saveInventoryItem(form);
    if (result.error) {
      notify?.(result.error, 'error');
      return;
    }

    notify?.('Inventory updated.', 'success');
    setForm((current) => ({ ...current, stock_quantity: '' }));
  };

  return (
    <Panel title="Inventory Management" subtitle="Track menu item stock and low-stock thresholds.">
      <div className="space-y-5">
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <form className="grid gap-3 md:grid-cols-5" onSubmit={submit}>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Menu item</span>
            <select
              value={form.menu_item_id}
              onChange={(event) => {
                const nextId = event.target.value;
                const existing = inventory.find((item) => String(item.menu_item_id) === nextId);
                setForm({
                  menu_item_id: nextId,
                  stock_quantity: existing?.stock_quantity ?? '',
                  unit: existing?.unit || 'pcs',
                  low_stock_threshold: existing?.low_stock_threshold ?? '5',
                  prevent_order_when_empty: Boolean(existing?.prevent_order_when_empty),
                });
              }}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              required
            >
              <option value="">Select item...</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Stock</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.stock_quantity}
              onChange={(event) => setForm((current) => ({ ...current, stock_quantity: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              required
            />
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Unit</span>
            <select
              value={form.unit}
              onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="liters">liters</option>
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Low alert</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.low_stock_threshold}
              onChange={(event) => setForm((current) => ({ ...current, low_stock_threshold: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <label className="flex items-center gap-2 md:col-span-4">
            <input
              type="checkbox"
              checked={form.prevent_order_when_empty}
              onChange={(event) => setForm((current) => ({ ...current, prevent_order_when_empty: event.target.checked }))}
            />
            <span className="text-sm font-medium text-ink/70">Prevent customer ordering when stock is empty</span>
          </label>

          <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50" disabled={loading}>
            Save Stock
          </button>
        </form>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-ink/50">
                  <th className="px-3 py-3 font-semibold">Item</th>
                  <th className="px-3 py-3 font-semibold">Stock</th>
                  <th className="px-3 py-3 font-semibold">Threshold</th>
                  <th className="px-3 py-3 font-semibold">Block Empty</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b border-brand-50">
                    <td className="px-3 py-3 font-medium text-ink">{item.menu_items?.name || `Item #${item.menu_item_id}`}</td>
                    <td className="px-3 py-3 text-ink/75">{item.stock_quantity} {item.unit}</td>
                    <td className="px-3 py-3 text-ink/75">{item.low_stock_threshold} {item.unit}</td>
                    <td className="px-3 py-3 text-ink/75">{item.prevent_order_when_empty ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {inventory.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                No inventory records yet.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl bg-brand-50 p-4">
            <p className="text-sm font-semibold text-ink">Low Stock Alerts</p>
            <div className="mt-3 space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                  {item.menu_items?.name || `Item #${item.menu_item_id}`}: {item.stock_quantity} {item.unit}
                </div>
              ))}
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-ink/60">No inventory low-stock alerts.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default InventoryManagementPanel;
