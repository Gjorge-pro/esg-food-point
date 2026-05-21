import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';
import { formatDateOnly } from '../adminUtils';
import { CostManagementPanel } from './CostManagementPanel';
import { ProfitAnalysisPanel } from './ProfitAnalysisPanel';
import { ItemProfitabilityTable } from './ItemProfitabilityTable';
import useFinancialData from '../../../hooks/useFinancialData';
import financialService from '../../../lib/financialService';

export function FinanceTab({
  data,
  isLoading,
  onLoad,
  onSaveIncome,
  onSaveExpense,
  onDeleteIncome,
  onDeleteExpense,
  notify,
  menuItems = [],
}) {
  const [period, setPeriod] = useState('daily');
  const [financialSummary, setFinancialSummary] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  
  const {
    itemCosts,
    financialExpenses,
    saveItemCost,
    saveExpense: saveFinancialExpense,
    deleteExpense: deleteFinancialExpense,
  } = useFinancialData();

  const [incomeForm, setIncomeForm] = useState({
    source: 'order',
    amount: '',
    payment_method: 'cash',
    recorded_date: formatDateOnly(new Date()),
  });
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    recorded_date: formatDateOnly(new Date()),
  });
  const [financialExpenseForm, setFinancialExpenseForm] = useState({
    title: '',
    amount: '',
    type: 'variable',
    category: '',
    description: '',
    expense_date: formatDateOnly(new Date()),
  });

  const loadFinancialSummary = async () => {
    setFinancialLoading(true);
    try {
      const summary = await financialService.getFinancialSummary(period);
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error loading financial summary:', error);
      notify('Failed to load financial data', 'error');
    } finally {
      setFinancialLoading(false);
    }
  };

  // Load financial summary
  useEffect(() => {
    loadFinancialSummary();
  }, [period, notify]);

  // Load existing data
  useEffect(() => {
    onLoad(period).catch(() => {});
  }, [onLoad, period]);

  const submitIncome = async (event) => {
    event.preventDefault();

    try {
      await onSaveIncome(incomeForm);
      notify('Income record created.', 'success');
      setIncomeForm((current) => ({ ...current, amount: '' }));
      await onLoad(period);
    } catch (error) {
      notify(error.message || 'Failed to save income record.', 'error');
    }
  };

  const submitExpense = async (event) => {
    event.preventDefault();

    try {
      await onSaveExpense(expenseForm);
      notify('Expense record created.', 'success');
      setExpenseForm((current) => ({ ...current, amount: '', description: '', category: '' }));
      await onLoad(period);
    } catch (error) {
      notify(error.message || 'Failed to save expense record.', 'error');
    }
  };

  const removeIncome = async (id) => {
    if (!window.confirm('Delete this income record?')) {
      return;
    }

    try {
      await onDeleteIncome(id);
      notify('Income record deleted.', 'success');
      await onLoad(period);
    } catch (error) {
      notify(error.message || 'Failed to delete income record.', 'error');
    }
  };

  const removeExpense = async (id) => {
    if (!window.confirm('Delete this expense record?')) {
      return;
    }

    try {
      await onDeleteExpense(id);
      notify('Expense record deleted.', 'success');
      await onLoad(period);
    } catch (error) {
      notify(error.message || 'Failed to delete expense record.', 'error');
    }
  };

  const submitFinancialExpense = async (event) => {
    event.preventDefault();

    const success = await saveFinancialExpense(financialExpenseForm);
    if (!success) {
      notify('Failed to save financial expense.', 'error');
      return;
    }

    notify('Financial expense recorded.', 'success');
    setFinancialExpenseForm((current) => ({
      ...current,
      title: '',
      amount: '',
      category: '',
      description: '',
    }));
    await loadFinancialSummary();
  };

  const removeFinancialExpense = async (id) => {
    if (!window.confirm('Delete this financial expense?')) {
      return;
    }

    const success = await deleteFinancialExpense(id);
    if (!success) {
      notify('Failed to delete financial expense.', 'error');
      return;
    }

    notify('Financial expense deleted.', 'success');
    await loadFinancialSummary();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Finance Management</h2>
          <p className="text-sm text-ink/60">
            Review income, track expenses, and compare totals across daily, weekly, and monthly periods.
          </p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Income" value={currency(data.totalIncome)} />
        <MetricCard label="Total Expenses" value={currency(data.totalExpenses)} />
        <MetricCard
          label="Profit"
          value={currency(data.profit)}
          tone={data.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}
        />
      </div>

      {/* NEW: FINANCIAL INTELLIGENCE SECTION */}
      <div className="space-y-6 border-t border-[var(--border)] pt-6">
        <div>
          <h3 className="text-lg font-semibold text-ink mb-2">💡 Business Intelligence</h3>
          <p className="text-sm text-ink/60">Advanced financial metrics and profitability analysis</p>
        </div>

        {/* Profit Analysis */}
        <ProfitAnalysisPanel 
          financialData={financialSummary || {}}
          loading={financialLoading}
        />

        {/* Cost Management */}
        {menuItems.length > 0 && (
          <CostManagementPanel 
            menuItems={menuItems}
            itemCosts={itemCosts}
            onSaveCost={saveItemCost}
            notify={notify}
          />
        )}

        <Panel title="Financial Expenses" subtitle="Fixed and variable costs used by net profit calculations.">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitFinancialExpense}>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Title</span>
              <input
                value={financialExpenseForm.title}
                onChange={(event) =>
                  setFinancialExpenseForm((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                required
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Amount</span>
              <input
                type="number"
                min="0"
                step="100"
                value={financialExpenseForm.amount}
                onChange={(event) =>
                  setFinancialExpenseForm((current) => ({ ...current, amount: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                required
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Type</span>
              <select
                value={financialExpenseForm.type}
                onChange={(event) =>
                  setFinancialExpenseForm((current) => ({ ...current, type: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Date</span>
              <input
                type="date"
                value={financialExpenseForm.expense_date}
                onChange={(event) =>
                  setFinancialExpenseForm((current) => ({ ...current, expense_date: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Category</span>
              <input
                value={financialExpenseForm.category}
                onChange={(event) =>
                  setFinancialExpenseForm((current) => ({ ...current, category: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Rent, payroll, supplies..."
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
                Add Financial Expense
              </button>
            </div>
          </form>

          <FinanceTable
            isLoading={financialLoading}
            rows={financialExpenses}
            columns={['Title', 'Amount', 'Type', 'Date']}
            renderRow={(entry) => (
              <>
                <td className="px-3 py-3 text-ink/75">{entry.title}</td>
                <td className="px-3 py-3 text-ink/75">{currency(entry.amount)}</td>
                <td className="px-3 py-3 capitalize text-ink/75">{entry.type}</td>
                <td className="px-3 py-3 text-ink/75">{entry.expense_date}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => removeFinancialExpense(entry.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </>
            )}
            emptyMessage="No financial expenses recorded for BI calculations."
          />
        </Panel>

        {/* Item Profitability Analysis */}
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

        {financialSummary?.topSellingItems?.length > 0 && (
          <ItemProfitabilityTable
            items={financialSummary.topSellingItems}
            title="📊 Top Selling Items"
            subtitle="Most popular items by quantity sold"
            loading={financialLoading}
          />
        )}
      </div>

      {/* ORIGINAL: INCOME & EXPENSE MANAGEMENT */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Income" subtitle="Orders and additional revenue sources.">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitIncome}>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Source</span>
              <select
                value={incomeForm.source}
                onChange={(event) => setIncomeForm((current) => ({ ...current, source: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="order">Orders</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Amount</span>
              <input
                type="number"
                min="0"
                step="100"
                value={incomeForm.amount}
                onChange={(event) => setIncomeForm((current) => ({ ...current, amount: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Payment method</span>
              <select
                value={incomeForm.payment_method}
                onChange={(event) =>
                  setIncomeForm((current) => ({ ...current, payment_method: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="cash">Cash</option>
                <option value="mobile_money">Mobile money</option>
                <option value="card">Card</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Date</span>
              <input
                type="date"
                value={incomeForm.recorded_date}
                onChange={(event) => setIncomeForm((current) => ({ ...current, recorded_date: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
                Add Income
              </button>
            </div>
          </form>

          <FinanceTable
            isLoading={isLoading}
            rows={data.income}
            columns={['Source', 'Amount', 'Payment', 'Date']}
            renderRow={(entry) => (
              <>
                <td className="px-3 py-3 capitalize text-ink/75">{entry.source.replace('_', ' ')}</td>
                <td className="px-3 py-3 text-ink/75">{currency(entry.amount)}</td>
                <td className="px-3 py-3 capitalize text-ink/75">{entry.payment_method?.replace('_', ' ') || '--'}</td>
                <td className="px-3 py-3 text-ink/75">{entry.recorded_date}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => removeIncome(entry.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </>
            )}
            emptyMessage="No income records in this period."
          />
        </Panel>

        <Panel title="Expenses" subtitle="Operating costs, purchases, and other outflows.">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitExpense}>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Description</span>
              <input
                value={expenseForm.description}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Amount</span>
              <input
                type="number"
                min="0"
                step="100"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amount: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Category</span>
              <input
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((current) => ({ ...current, category: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Supplies, Utilities, Payroll..."
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Date</span>
              <input
                type="date"
                value={expenseForm.recorded_date}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, recorded_date: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
                Add Expense
              </button>
            </div>
          </form>

          <FinanceTable
            isLoading={isLoading}
            rows={data.expenses}
            columns={['Description', 'Amount', 'Category', 'Date']}
            renderRow={(entry) => (
              <>
                <td className="px-3 py-3 text-ink/75">{entry.description}</td>
                <td className="px-3 py-3 text-ink/75">{currency(entry.amount)}</td>
                <td className="px-3 py-3 text-ink/75">{entry.category}</td>
                <td className="px-3 py-3 text-ink/75">{entry.recorded_date}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => removeExpense(entry.id)}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </>
            )}
            emptyMessage="No expense records in this period."
          />
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

function FinanceTable({ isLoading, rows, columns, renderRow, emptyMessage }) {
  return (
    <div className="mt-6 overflow-x-auto">
      {isLoading ? <p className="py-8 text-center text-sm text-ink/60">Loading records...</p> : null}
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-ink/50">
            {columns.map((column) => (
              <th key={column} className="px-3 py-3 font-semibold">
                {column}
              </th>
            ))}
            <th className="px-3 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-brand-50">
              {renderRow(row)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && !isLoading ? (
        <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">{emptyMessage}</p>
      ) : null}
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
