import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';

/**
 * Profit Analysis Panel - Display financial metrics
 */
export function ProfitAnalysisPanel({ financialData, loading }) {
  if (loading) {
    return (
      <Panel title="📊 Profit Analysis" subtitle="Financial performance summary">
        <div className="py-8 text-center text-sm text-[var(--text-secondary)]">Loading...</div>
      </Panel>
    );
  }

  const financial = financialData.financial || {};

  return (
    <Panel title="📊 Profit Analysis" subtitle="Financial performance summary">
      <div className="space-y-6">
        {/* Revenue Section */}
        <div className="rounded-xl bg-[var(--bg-main)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            📈 Revenue
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {currency(financial.revenue || 0)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Total from completed orders</p>
        </div>

        {/* COGS Section */}
        <div className="rounded-xl bg-[var(--bg-main)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            🛒 Cost of Goods Sold (COGS)
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {currency(financial.cogs || 0)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {financial.revenue > 0
              ? `${((financial.cogs / financial.revenue) * 100).toFixed(1)}% of revenue`
              : 'Set item costs to calculate'}
          </p>
        </div>

        {/* Gross Profit Section */}
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 p-4 border border-emerald-200">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            💚 Gross Profit
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {currency(financial.grossProfit || 0)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">Amount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {(financial.grossMarginPercent || 0).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-emerald-700">Margin</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-600">
            = Revenue - COGS
          </p>
        </div>

        {/* Expenses Section */}
        <div className="rounded-xl bg-[var(--bg-main)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            💸 Operating Expenses
          </p>
          <p className="mt-2 text-3xl font-bold text-orange-600">
            {currency(financial.expenses || 0)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[var(--text-secondary)]">Fixed</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {currency(financial.expensesByType?.fixed || 0)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-secondary)]">Variable</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {currency(financial.expensesByType?.variable || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Net Profit Section */}
        <div className={`rounded-xl p-4 border-2 ${financial.netProfit >= 0 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${financial.netProfit >= 0 
            ? 'text-emerald-700' 
            : 'text-red-700'
          }`}>
            🎯 Net Profit (Bottom Line)
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <p className={`text-3xl font-bold ${financial.netProfit >= 0 
                ? 'text-emerald-600' 
                : 'text-red-600'
              }`}>
                {currency(financial.netProfit || 0)}
              </p>
              <p className={`mt-1 text-xs ${financial.netProfit >= 0 
                ? 'text-emerald-700' 
                : 'text-red-700'
              }`}>
                Amount
              </p>
            </div>
            <div>
              <p className={`text-3xl font-bold ${financial.netProfit >= 0 
                ? 'text-emerald-600' 
                : 'text-red-600'
              }`}>
                {(financial.netMarginPercent || 0).toFixed(1)}%
              </p>
              <p className={`mt-1 text-xs ${financial.netProfit >= 0 
                ? 'text-emerald-700' 
                : 'text-red-700'
              }`}>
                Margin
              </p>
            </div>
          </div>
          <p className={`mt-2 text-xs ${financial.netProfit >= 0 
            ? 'text-emerald-600' 
            : 'text-red-600'
          }`}>
            = Gross Profit - Expenses
          </p>
        </div>

        {/* Breakdown Formula */}
        <div className="rounded-xl bg-[var(--bg-main)] p-4 text-xs text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)] mb-2">Formula:</p>
          <div className="space-y-1 font-mono text-xs">
            <p>📊 Revenue: {currency(financial.revenue || 0)}</p>
            <p className="text-[var(--text-secondary)]">   − COGS: {currency(financial.cogs || 0)}</p>
            <p className="border-t border-[var(--border)] pt-1 text-[var(--text-primary)] font-semibold">
              = Gross Profit: {currency(financial.grossProfit || 0)}
            </p>
            <p className="text-[var(--text-secondary)]">   − Expenses: {currency(financial.expenses || 0)}</p>
            <p className="border-t border-[var(--border)] pt-1 text-emerald-600 font-bold">
              = Net Profit: {currency(financial.netProfit || 0)}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default ProfitAnalysisPanel;
