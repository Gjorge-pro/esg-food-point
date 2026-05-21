import { useEffect, useState } from 'react';
import { Panel } from '../../components/Panel';
import { currency } from '../../lib/formatters';
import financialService from '../../lib/financialService';

export function ItemProfitabilityReport({ notify }) {
  const [period, setPeriod] = useState('daily');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(endDate);
      if (period === 'weekly') startDate.setDate(startDate.getDate() - 6);
      if (period === 'monthly') startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      setItems(await financialService.getItemProfitability(startDate, endDate));
    } catch (error) {
      notify?.(error.message || 'Failed to load profitability.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [period]);

  return (
    <Panel title="Item Profitability Reports" subtitle="Revenue, production cost, profit, and margin by menu item.">
      <div className="mb-4 flex flex-wrap gap-2">
        {['daily', 'weekly', 'monthly'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setPeriod(option)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              period === option ? 'bg-brand-500 text-white' : 'bg-[var(--bg-main)] text-[var(--text-primary)]'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <p className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading profitability...</p> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3">Sold</th>
              <th className="px-3 py-3">Revenue</th>
              <th className="px-3 py-3">Production Cost</th>
              <th className="px-3 py-3">Profit</th>
              <th className="px-3 py-3">Margin</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item.name} className="border-b border-[var(--border)]">
                <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{item.name}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{item.quantity}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{currency(item.revenue)}</td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{currency(item.cogs)}</td>
                <td className={item.profit >= 0 ? 'px-3 py-3 font-semibold text-green-600 dark:text-green-400' : 'px-3 py-3 font-semibold text-red-600 dark:text-red-400'}>
                  {currency(item.profit)}
                </td>
                <td className="px-3 py-3 text-[var(--text-secondary)]">{item.profitMargin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !loading ? (
          <p className="mt-4 rounded-2xl bg-[var(--bg-main)] px-4 py-5 text-sm text-[var(--text-secondary)]">No paid sales with production usage in this period yet.</p>
        ) : null}
      </div>
    </Panel>
  );
}

export default ItemProfitabilityReport;
