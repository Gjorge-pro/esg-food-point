import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';

/**
 * Item Profitability Table - Shows which items are most/least profitable
 */
export function ItemProfitabilityTable({ 
  items = [], 
  title = "Item Profitability", 
  subtitle = "Revenue, costs, and profit by menu item",
  loading = false 
}) {
  if (loading) {
    return (
      <Panel title={title} subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading...</div>
      </Panel>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Panel title={title} subtitle={subtitle}>
        <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
          No data available. Add menu item costs to see profitability analysis.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="px-3 py-3 font-semibold">Item Name</th>
              <th className="px-3 py-3 font-semibold text-right">Qty Sold</th>
              <th className="px-3 py-3 font-semibold text-right">Revenue</th>
              <th className="px-3 py-3 font-semibold text-right">COGS</th>
              <th className="px-3 py-3 font-semibold text-right">Profit</th>
              <th className="px-3 py-3 font-semibold text-right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const profitColor = item.profit > 0 ? 'text-emerald-600' : 'text-red-600';
              const marginColor = item.profitMargin > 30 ? 'text-emerald-600' : item.profitMargin > 10 ? 'text-amber-600' : 'text-red-600';

              return (
                <tr
                  key={item.id || idx}
                  className="border-b border-[var(--bg-main)] hover:bg-[var(--bg-main)] transition-colors"
                >
                  <td className="px-3 py-3 text-[var(--text-primary)] font-medium">
                    {item.name}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--text-primary)]">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--text-primary)]">
                    {currency(item.revenue)}
                  </td>
                  <td className="px-3 py-3 text-right text-[var(--text-primary)]">
                    {currency(item.cogs)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${profitColor}`}>
                    {currency(item.profit)}
                  </td>
                  <td className={`px-3 py-3 text-right font-semibold ${marginColor}`}>
                    {(item.profitMargin || 0).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Row */}
      {items.length > 0 && (
        <div className="mt-4 rounded-xl bg-[var(--bg-main)] p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm">
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Total Qty</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Total Revenue</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {currency(items.reduce((sum, item) => sum + (item.revenue || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Total COGS</p>
              <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                {currency(items.reduce((sum, item) => sum + (item.cogs || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Total Profit</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                {currency(items.reduce((sum, item) => sum + (item.profit || 0), 0))}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Avg Margin</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                {items.length > 0
                  ? (items.reduce((sum, item) => sum + (item.profitMargin || 0), 0) / items.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

export default ItemProfitabilityTable;
