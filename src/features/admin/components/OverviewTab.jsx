import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';
import { ExpensePieChart } from './charts/ExpensePieChart';
import { IncomeExpenseChart } from './charts/IncomeExpenseChart';
import { OrdersChart } from './charts/OrdersChart';
import { TopItemsChart } from './charts/TopItemsChart';
import { HourlyOrdersChart } from './charts/HourlyOrdersChart';

export function OverviewTab({ data, isLoading, onRefresh, lastLoadedAt }) {
  const [chartPeriod, setChartPeriod] = useState(data.chartPeriod || 'weekly');

  useEffect(() => {
    onRefresh(chartPeriod).catch(() => {});
  }, [chartPeriod, onRefresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Today&apos;s Summary</h2>
          <p className="text-sm text-ink/60">
            Snapshot of business performance for the current day.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PeriodFilter period={chartPeriod} onChange={setChartPeriod} />
          <button
            type="button"
            onClick={() => onRefresh(chartPeriod).catch(() => {})}
            className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink transition hover:bg-brand-50"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Orders" value={data.totalOrders} />
        <SummaryCard label="Paid Revenue" value={currency(data.totalIncome)} />
        <SummaryCard label="Total Expenses" value={currency(data.totalExpenses)} />
        <SummaryCard
          label="Profit"
          value={currency(data.profit)}
          tone={data.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard label="Paid Orders" value={data.paidOrders || 0} tone="text-emerald-600" />
        <SummaryCard label="Unpaid Orders" value={data.unpaidOrders || 0} tone="text-amber-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Waste Qty" value={data.operational?.wasteQuantity || 0} tone="text-red-600" />
        <SummaryCard label="Leftover Qty" value={data.operational?.leftoverQuantity || 0} tone="text-emerald-600" />
        <SummaryCard label="Supplier Debt" value={currency(data.operational?.debt || 0)} tone="text-amber-600" />
        <SummaryCard label="Service Completion" value={`${data.operational?.serviceCompletionRate || 0}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Performance Insights"
          subtitle={lastLoadedAt ? `Last refreshed ${new Date(lastLoadedAt).toLocaleString()}` : 'No data loaded yet.'}
        >
          {isLoading ? (
            <LoadingState message="Loading today&apos;s performance..." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">
                  Orders by type
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InsightStat label="Dine-in" value={data.ordersByType.dine_in} />
                  <InsightStat label="Delivery" value={data.ordersByType.delivery} />
                </div>
              </div>

              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">
                  Unpaid deliveries
                </p>
                <p className="mt-3 text-3xl font-semibold text-ink">{data.unpaidDeliveries}</p>
                <p className="mt-2 text-sm text-ink/60">
                  Delivery records that still need payment follow-up today.
                </p>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-4 lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-ink">Most Sold Items</p>
                  <span className="text-xs uppercase tracking-[0.14em] text-ink/45">Top sellers</span>
                </div>
                {data.topSoldItems.length > 0 ? (
                  <div className="space-y-3">
                    {data.topSoldItems.map((item) => (
                      <div key={item.name} className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                        <div>
                          <p className="font-medium text-ink">{item.name}</p>
                          <p className="text-sm text-ink/55">{item.quantity} item(s) sold</p>
                        </div>
                        <p className="font-semibold text-ink">{currency(item.revenue)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyNote message="No sales recorded yet for today." />
                )}
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Alerts" subtitle="Warnings that need the owner&apos;s attention.">
            {isLoading ? (
              <LoadingState message="Checking alerts..." />
            ) : data.alerts.length > 0 ? (
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <div key={alert.title} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">{alert.title}</p>
                    <p className="mt-1 text-sm text-amber-800">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNote message="No warnings right now." />
            )}
          </Panel>

          <Panel title="Low Stock" subtitle="Items at or below the current low-stock threshold.">
            {isLoading ? (
              <LoadingState message="Reviewing stock levels..." />
            ) : data.lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {data.lowStockItems.map((item) => (
                  <div key={item.item_name} className="rounded-2xl bg-red-50 px-4 py-3">
                    <p className="font-medium text-red-900">{item.item_name}</p>
                    <p className="text-sm text-red-700">
                      Remaining stock: {item.remaining ?? '--'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyNote message="No low-stock items were found in the latest stock snapshot." />
            )}
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Sales & Profit Trend"
          subtitle={`Trend for the selected ${chartPeriod} period (${data.range.startDate} to ${data.range.endDate}).`}
        >
          {isLoading ? <LoadingState message="Loading income and expense chart..." /> : <IncomeExpenseChart data={data.incomeExpenseSeries} />}
        </Panel>

        <Panel
          title="Top Selling Items"
          subtitle="Most sold menu items in the selected period."
        >
          {isLoading ? <LoadingState message="Loading top-selling item chart..." /> : <TopItemsChart data={data.topItemsChartData} />}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Orders Over Time" subtitle="Order volume trend for the selected period.">
          {isLoading ? <LoadingState message="Loading orders chart..." /> : <OrdersChart data={data.ordersSeries} />}
        </Panel>

        <Panel title="Orders Per Hour" subtitle="Today&apos;s order activity by hour.">
          {isLoading ? <LoadingState message="Loading hourly order chart..." /> : <HourlyOrdersChart data={data.hourlyOrdersSeries || []} />}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Expense Breakdown" subtitle="Distribution of expenses by category.">
          {isLoading ? <LoadingState message="Loading expense breakdown chart..." /> : <ExpensePieChart data={data.expenseDistribution} />}
        </Panel>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function InsightStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-ink/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function LoadingState({ message }) {
  return <p className="py-10 text-center text-sm text-ink/60">{message}</p>;
}

function EmptyNote({ message }) {
  return <p className="rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">{message}</p>;
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
