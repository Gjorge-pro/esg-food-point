import { useEffect, useState } from 'react';
import { Package, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useProduction } from '../../hooks/useProduction';
import { useStock } from '../../hooks/useStock';
import { useDeliveries } from '../../hooks/useDeliveries';
import { currency } from '../../lib/formatters';
import financialService from '../../lib/financialService';
import analyticsService from '../../services/analyticsService';

export function ReportsPanel() {
  const [ordersResult, setOrdersResult] = useState({ total: 0, served: 0, pending: 0 });
  const [financialData, setFinancialData] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0
  });
  const [customerSources, setCustomerSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { todayProduction = [], todayTotal = 0 } = useProduction();
  const { opening = [], usage = [] } = useStock();
  const { todayDeliveries = [], unpaidCount = 0 } = useDeliveries();

  // Load financial data from centralized service
  useEffect(() => {
    const loadFinancialData = async () => {
      setIsLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endToday = new Date();
        endToday.setHours(23, 59, 59, 999);

        const [netProfit, customerSourceAnalytics] = await Promise.all([
          financialService.calculateNetProfit(today, endToday),
          analyticsService.getCustomerSourceAnalytics(today, endToday)
        ]);

        setFinancialData({
          revenue: netProfit.revenue || 0,
          expenses: netProfit.expenses || 0,
          netProfit: netProfit.netProfit || 0,
          grossMarginPercent: netProfit.grossMarginPercent || 0
        });

        setCustomerSources(customerSourceAnalytics);
      } catch (error) {
        console.error('Error loading financial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinancialData();
  }, []);

  // Load order data
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    const fetchOrders = async () => {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id, status, created_at')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        if (!error && orders) {
          const served = orders.filter((order) => ['served', 'delivered'].includes(order.status)).length;
          const pending = orders.filter((order) =>
            ['pending', 'accepted', 'cooking', 'ready'].includes(order.status),
          ).length;

          setOrdersResult({
            total: orders.length,
            served,
            pending,
          });
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const deliveredCount = todayDeliveries.length;
  const stockItems = opening.length;
  const usageCount = usage.length;
  const profitColor = financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold">Daily Report</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-blue-700">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{ordersResult.total}</p>
            </div>
            <div className="text-blue-400 text-sm flex-shrink-0">Orders</div>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-green-600">Served: {ordersResult.served}</p>
            <p className="text-amber-600">Pending: {ordersResult.pending}</p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-blue-700">Food Produced</p>
              <p className="text-lg sm:text-xl font-bold text-blue-900">{todayProduction.length} items</p>
            </div>
            <div className="text-blue-400 text-sm flex-shrink-0">Kitchen</div>
          </div>
          <p className="mt-2 text-xs text-blue-700">Value: {currency(todayTotal)}</p>
        </div>

        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-green-700">Stock Items</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{stockItems}</p>
            </div>
            <div className="text-green-400 flex-shrink-0">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <p className="text-amber-600">Used: {usageCount}</p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-blue-700">Deliveries</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{deliveredCount}</p>
            </div>
            <div className="text-blue-400 flex-shrink-0">
              <Truck size={20} />
            </div>
          </div>
          <p className="mt-2 text-xs text-red-600">Unpaid: {unpaidCount}</p>
        </div>
      </div>

      <div className="rounded-lg border-2 border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h3 className="mb-4 font-bold text-sm sm:text-base">Financial Summary (Today)</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded bg-green-100 dark:bg-green-900/20 p-3">
            <p className="mb-1 text-xs text-green-700 dark:text-green-400">Revenue</p>
            <p className="text-base sm:text-lg font-bold text-green-900 dark:text-green-300 truncate">{currency(financialData.revenue)}</p>
          </div>
          <div className="rounded bg-red-100 dark:bg-red-900/20 p-3">
            <p className="mb-1 text-xs text-red-700 dark:text-red-400">Expenses</p>
            <p className="text-base sm:text-lg font-bold text-red-900 dark:text-red-300 truncate">{currency(financialData.expenses)}</p>
          </div>
          <div className="rounded bg-blue-100 dark:bg-blue-900/20 p-3">
            <p className="mb-1 text-xs text-blue-700 dark:text-blue-400">Net Profit</p>
            <p className={`text-base sm:text-lg font-bold truncate ${profitColor}`}>{currency(financialData.netProfit)}</p>
          </div>
        </div>
        {isLoading && <p className="mt-2 text-xs sm:text-sm text-gray-500">Loading financial data...</p>}
      </div>

      {customerSources.length > 0 && (
        <div className="rounded-lg border-2 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 p-4 overflow-x-auto">
          <h3 className="mb-3 font-bold text-xs sm:text-sm text-purple-900 dark:text-purple-300">Customer Sources Today</h3>
          <div className="grid gap-2 min-w-min">
            {customerSources.map(source => (
              <div key={source.source} className="flex justify-between rounded bg-white dark:bg-gray-800 p-2 gap-4">
                <span className="text-xs sm:text-sm font-medium capitalize text-purple-700 dark:text-purple-300 whitespace-nowrap">{source.source.replace(/_/g, ' ')}</span>
                <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">{source.total_orders} orders ({source.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-brand-100 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20 p-4">
        <h3 className="mb-3 font-bold text-xs sm:text-sm">Today&apos;s Summary</h3>
        <div className="space-y-2 text-xs sm:text-sm text-ink/75 dark:text-gray-300">
          <p>
            <span className="font-semibold">{ordersResult.total} orders</span> placed (Served: {ordersResult.served}, Pending: {ordersResult.pending})
          </p>
          <p>
            <span className="font-semibold">{todayProduction.length} items</span> produced (Value: {currency(todayTotal)})
          </p>
          <p>
            <span className="font-semibold">{stockItems} items</span> in opening stock ({usageCount} used)
          </p>
          <p>
            <span className="font-semibold">{deliveredCount} deliveries</span> ({unpaidCount} unpaid)
          </p>
          <p className={`font-semibold ${profitColor}`}>Net Profit: {currency(financialData.netProfit)}</p>
        </div>
      </div>
    </div>
  );
}
