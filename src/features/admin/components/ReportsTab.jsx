import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';
import { ExpensePieChart } from './charts/ExpensePieChart';
import { IncomeExpenseChart } from './charts/IncomeExpenseChart';
import { OrdersChart } from './charts/OrdersChart';
import { TopItemsChart } from './charts/TopItemsChart';
import { HourlyOrdersChart } from './charts/HourlyOrdersChart';
import { ProfitAnalysisPanel } from './ProfitAnalysisPanel';
import { ItemProfitabilityTable } from './ItemProfitabilityTable';
import { ReceiptLookupPanel } from './ReceiptLookupPanel';
import financialService from '../../../lib/financialService';

export function ReportsTab({ data, isLoading, onLoad, notify }) {
  const [period, setPeriod] = useState('daily');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Load financial summary alongside existing report data
  useEffect(() => {
    onLoad(period).catch(() => {});

    const loadFinancialData = async () => {
      setFinancialLoading(true);
      try {
        const summary = await financialService.getFinancialSummary(period);
        setFinancialSummary(summary);
      } catch (error) {
        console.error('Error loading financial summary:', error);
      } finally {
        setFinancialLoading(false);
      }
    };

    loadFinancialData();
  }, [onLoad, period]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Reports</h2>
          <p className="text-sm text-ink/60">
            Generate daily, weekly, and monthly report views for restaurant decision-making.
          </p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Orders" value={data.totalOrders} />
        <MetricCard label="Paid Revenue" value={currency(data.totalIncome)} />
        <MetricCard label="Total Expenses" value={currency(data.totalExpenses)} />
        <MetricCard
          label="Profit"
          value={currency(data.profit)}
          tone={data.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard label="Paid Orders" value={data.paidOrders || 0} tone="text-emerald-600" />
        <MetricCard label="Unpaid Orders" value={data.unpaidOrders || 0} tone="text-amber-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Waste Qty" value={data.operational?.wasteQuantity || 0} tone="text-red-600" />
        <MetricCard label="Leftovers Qty" value={data.operational?.leftoverQuantity || 0} tone="text-emerald-600" />
        <MetricCard label="Supplier Debt" value={currency(data.operational?.debt || 0)} tone="text-amber-600" />
        <MetricCard label="Service Completion" value={`${data.operational?.serviceCompletionRate || 0}%`} />
      </div>

      <ReceiptLookupPanel notify={notify} />

      {/* NEW: FINANCIAL INTELLIGENCE SECTION */}
      <div className="space-y-6 border-t border-[var(--border)] pt-6">
        <div>
          <h3 className="text-lg font-semibold text-ink mb-2">💡 Profitability & Analytics</h3>
          <p className="text-sm text-ink/60">Detailed financial analysis and item-level profitability</p>
        </div>

        {/* Profit Analysis Panel */}
        <ProfitAnalysisPanel 
          financialData={financialSummary || {}}
          loading={financialLoading}
        />

        {/* Most & Least Profitable Items */}
        {financialSummary?.mostProfitableItems?.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ItemProfitabilityTable
              items={financialSummary.mostProfitableItems}
              title="🌟 Most Profitable Items"
              subtitle="Items with highest profit margin"
              loading={financialLoading}
            />
            <ItemProfitabilityTable
              items={financialSummary.leastProfitableItems}
              title="⚠️ Items to Review"
              subtitle="Lowest profit items - consider pricing or cost reduction"
              loading={financialLoading}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title={`${capitalize(period)} Summary`}
          subtitle={`Report range: ${data.range.startDate} to ${data.range.endDate}`}
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading report summary...</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">Orders by type</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ReportStat label="Dine-in" value={data.ordersByType.dine_in} />
                  <ReportStat label="Delivery" value={data.ordersByType.delivery} />
                </div>
              </div>

              <div className="rounded-2xl bg-brand-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">Top sold items</p>
                <div className="mt-4 space-y-3">
                  {data.topSoldItems.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                      <div>
                        <p className="font-medium text-ink">{item.name}</p>
                        <p className="text-sm text-ink/55">{item.quantity} sold</p>
                      </div>
                      <p className="font-semibold text-ink">{currency(item.revenue)}</p>
                    </div>
                  ))}
                  {data.topSoldItems.length === 0 ? (
                    <p className="text-sm text-ink/60">No sales recorded in this period.</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Daily Breakdown" subtitle="Tables make it easier to compare each day inside the selected period.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading breakdown...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-100 text-ink/50">
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Orders</th>
                    <th className="px-3 py-3 font-semibold">Income</th>
                    <th className="px-3 py-3 font-semibold">Expenses</th>
                    <th className="px-3 py-3 font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((row) => (
                    <tr key={row.date} className="border-b border-brand-50">
                      <td className="px-3 py-3 text-ink/75">{row.date}</td>
                      <td className="px-3 py-3 text-ink/75">{row.orders}</td>
                      <td className="px-3 py-3 text-ink/75">{currency(row.income)}</td>
                      <td className="px-3 py-3 text-ink/75">{currency(row.expenses)}</td>
                      <td className={`px-3 py-3 font-medium ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {currency(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.breakdown.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                  No report rows found in this period.
                </p>
              ) : null}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Sales & Profit Trend" subtitle="Track income, expenses, and profit across the selected period.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading income and expense chart...</p>
          ) : (
            <IncomeExpenseChart data={data.incomeExpenseSeries} />
          )}
        </Panel>

        <Panel title="Orders Over Time" subtitle="Understand how order volume changes across the selected period.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading orders chart...</p>
          ) : (
            <OrdersChart data={data.ordersSeries} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top Selling Items" subtitle="Compare the strongest selling menu items.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading top-selling item chart...</p>
          ) : (
            <TopItemsChart data={data.topSoldItems} />
          )}
        </Panel>

        <Panel title="Expense Breakdown" subtitle="See which expense categories drive spend in this period.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading expense breakdown chart...</p>
          ) : (
            <ExpensePieChart data={data.expenseDistribution} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Orders Per Hour" subtitle="Order activity by hour inside the selected report period.">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-ink/60">Loading hourly order chart...</p>
          ) : (
            <HourlyOrdersChart data={data.hourlyOrdersSeries || []} />
          )}
        </Panel>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/50">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${tone}`}>{value}</p>
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
          {capitalize(option)}
        </button>
      ))}
    </div>
  );
}

function ReportStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.15em] text-ink/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
