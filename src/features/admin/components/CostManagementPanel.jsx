import { useState } from 'react';
import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';

/**
 * Cost Management Panel - Manage item costs for COGS calculation
 */
export function CostManagementPanel({ menuItems, itemCosts, onSaveCost, notify }) {
  const [selectedItem, setSelectedItem] = useState('');
  const [costForm, setCostForm] = useState({ cost: '', notes: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedItem || !costForm.cost) {
      notify('Please select an item and enter a cost', 'error');
      return;
    }

    try {
      const success = await onSaveCost(parseInt(selectedItem), parseFloat(costForm.cost), costForm.notes);
      if (success) {
        notify('✅ Item cost saved', 'success');
        setCostForm({ cost: '', notes: '' });
        setSelectedItem('');
      }
    } catch (error) {
      notify('❌ Failed to save cost', 'error');
    }
  };

  const currentItemCost = selectedItem 
    ? itemCosts.find(ic => ic.menu_item_id === parseInt(selectedItem))
    : null;

  return (
    <Panel title="💰 Cost Management" subtitle="Set unit cost for each menu item to calculate COGS">
      <div className="space-y-4">
        {/* Cost Entry Form */}
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-3">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Menu Item
            </span>
            <select
              value={selectedItem}
              onChange={(e) => {
                setSelectedItem(e.target.value);
                const item = itemCosts.find(ic => ic.menu_item_id === parseInt(e.target.value));
                if (item) {
                  setCostForm({ cost: item.cost_per_unit, notes: item.notes || '' });
                } else {
                  setCostForm({ cost: '', notes: '' });
                }
              }}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              <option value="">Select item...</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} ({currency(item.price)})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Cost per Unit (TSH)
            </span>
            <input
              type="number"
              min="0"
              step="100"
              value={costForm.cost}
              onChange={(e) => setCostForm(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="e.g., 5000"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </label>

          <label className="flex flex-col justify-end">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              &nbsp;
            </span>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 font-semibold text-white hover:opacity-90 transition-all duration-200"
            >
              Save Cost
            </button>
          </label>
        </form>

        {/* Cost List Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-3 py-3 font-semibold">Item Name</th>
                <th className="px-3 py-3 font-semibold">Sell Price</th>
                <th className="px-3 py-3 font-semibold">Cost Price</th>
                <th className="px-3 py-3 font-semibold">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map(item => {
                const cost = itemCosts.find(ic => ic.menu_item_id === item.id);
                const margin = cost && item.price > 0 
                  ? (((item.price - cost.cost_per_unit) / item.price) * 100).toFixed(1)
                  : '—';

                return (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--bg-main)] hover:bg-[var(--bg-main)] transition-colors"
                  >
                    <td className="px-3 py-3 text-[var(--text-primary)]">{item.name}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">{currency(item.price)}</td>
                    <td className="px-3 py-3 text-[var(--text-primary)]">
                      {cost ? currency(cost.cost_per_unit) : <span className="text-[var(--text-secondary)]">Not set</span>}
                    </td>
                    <td className={`px-3 py-3 font-semibold ${margin > 30 ? 'text-emerald-600' : margin > 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {margin}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

export default CostManagementPanel;
