import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';
import { InventoryManagementPanel } from './InventoryManagementPanel';

export function StockTab({ data, isLoading, onLoad, menuItems = [], notify }) {
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    onLoad(period).catch(() => {});
  }, [onLoad, period]);

  const totalRemaining = data.rows.reduce(
    (sum, row) => sum + (row.remaining !== null ? Number(row.remaining) : 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Stock & Production Analysis</h2>
          <p className="text-sm text-ink/60">
            Compare opening stock, production, internal usage, closing stock, and estimated sold quantities.
          </p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Tracked Items" value={data.rows.length} />
        <MetricCard label="Low Stock Alerts" value={data.lowStockItems.length} />
        <MetricCard label="Remaining Stock" value={totalRemaining} />
      </div>

      <InventoryManagementPanel menuItems={menuItems} notify={notify} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Stock Analysis Table" subtitle="Sold quantity uses the formula opening + produced - closing - used.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading stock analysis...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-ink/50">
                    <th className="px-3 py-3 font-semibold">Item</th>
                    <th className="px-3 py-3 font-semibold">Opening</th>
                    <th className="px-3 py-3 font-semibold">Produced</th>
                    <th className="px-3 py-3 font-semibold">Used</th>
                    <th className="px-3 py-3 font-semibold">Closing</th>
                    <th className="px-3 py-3 font-semibold">Sold</th>
                    <th className="px-3 py-3 font-semibold">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.item_name} className="border-b border-brand-50">
                      <td className="px-3 py-3 font-medium text-ink">{row.item_name}</td>
                      <td className="px-3 py-3 text-ink/75">{row.opening}</td>
                      <td className="px-3 py-3 text-ink/75">{row.produced}</td>
                      <td className="px-3 py-3 text-ink/75">{row.used}</td>
                      <td className="px-3 py-3 text-ink/75">{formatStockValue(row.closing)}</td>
                      <td className="px-3 py-3 text-ink/75">{formatStockValue(row.sold)}</td>
                      <td className="px-3 py-3 text-ink/75">{formatStockValue(row.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.rows.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                  No stock records found in this period.
                </p>
              ) : null}
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Most Used Items" subtitle="Internal usage ranked by quantity.">
            <InsightList
              isLoading={isLoading}
              items={data.mostUsedItems}
              emptyMessage="No internal usage recorded in this period."
              renderLabel={(item) => item.item_name}
              renderValue={(item) => `${item.used} used`}
            />
          </Panel>

          <Panel title="Low Stock Alerts" subtitle="Items at or below the low-stock threshold.">
            <InsightList
              isLoading={isLoading}
              items={data.lowStockItems}
              emptyMessage="No low-stock alerts in this period."
              renderLabel={(item) => item.item_name}
              renderValue={(item) => `${item.remaining} remaining`}
            />
          </Panel>

          <Panel title="Potential Waste" subtitle="Items where produced quantity appears high versus sold and remaining stock.">
            <InsightList
              isLoading={isLoading}
              items={data.wasteItems}
              emptyMessage="No waste indicators found in this period."
              renderLabel={(item) => item.item_name}
              renderValue={(item) => `${item.potentialWaste} potential waste`}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function InsightList({ isLoading, items, emptyMessage, renderLabel, renderValue }) {
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-ink/60">Loading insights...</p>;
  }

  if (items.length === 0) {
    return <p className="rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.item_name} className="rounded-2xl bg-brand-50 px-4 py-3">
          <p className="font-medium text-ink">{renderLabel(item)}</p>
          <p className="text-sm text-ink/60">{renderValue(item)}</p>
        </div>
      ))}
    </div>
  );
}

function PeriodFilter({ period, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['daily', 'weekly', 'monthly'].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            period === option ? 'bg-brand-500 text-white' : 'bg-brand-50 text-ink'
          }`}
        >
          {option.charAt(0).toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

function formatStockValue(value) {
  return value === null ? '--' : value;
}
