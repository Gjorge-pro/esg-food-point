import { useState } from 'react';
import { DeliveryPanel } from '../orders/DeliveryPanel';
import { FinancePanel } from '../finance/FinancePanel';
import { MenuAvailabilityPanel } from '../inventory/MenuAvailabilityPanel';
import { MenuManagementPanel } from '../inventory/MenuManagementPanel';
import { OrdersPanel } from '../orders/OrdersPanel';
import { ProductionPanel } from '../production/ProductionPanel';
import { ReportsPanel } from '../finance/ReportsPanel';
import { RequestsPanel } from '../orders/RequestsPanel';
import { StockPanel } from '../inventory/StockPanel';
import { useAuth } from '../../contexts/AuthContext';
import { LogoutButton } from '../../components/LogoutButton';
import { ThemeToggle } from '../../components/ThemeToggle';

// Wrapper for OrdersPanel to pre-filter (Implementation can be added to OrdersPanel to accept a filter prop, or just use OrdersPanel as is for now while we scaffold)
const NewOrdersTab = () => <OrdersPanel defaultFilter="pending" />;
const KitchenQueueTab = () => <OrdersPanel defaultFilter="in-progress" />;
const CompletedOrdersTab = () => <OrdersPanel defaultFilter="completed" />;

const tabs = [
  { id: 'new_orders', label: 'New Orders', component: NewOrdersTab },
  { id: 'kitchen', label: 'Kitchen Queue', component: KitchenQueueTab },
  { id: 'deliveries', label: 'Deliveries', component: DeliveryPanel },
  { id: 'manual_orders', label: 'Manual Orders', component: () => <div className="p-8 text-center text-gray-600 dark:text-gray-400">Phone/Walk-in order entry coming soon.</div> },
  { id: 'completed', label: 'Completed Orders', component: CompletedOrdersTab },
  { id: 'production', label: 'Daily Production', component: ProductionPanel },
  { id: 'finance', label: 'Expenses & Debts', component: FinancePanel },
];

export function ServiceDeskView() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState('new_orders');
  const visibleTabs = (() => {
    const role = auth.profile?.role;
    if (role === 'waiter') {
      return tabs.filter((tab) => ['new_orders', 'deliveries', 'completed', 'manual_orders'].includes(tab.id));
    }
    if (role === 'kitchen') {
      return tabs.filter((tab) => ['kitchen', 'production'].includes(tab.id));
    }
    return tabs; // admin, service_desk, manager see all
  })();
  const CurrentComponent = visibleTabs.find((tab) => tab.id === activeTab)?.component || visibleTabs[0]?.component;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <div className="app-hero p-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white dark:text-gray-100">Service Desk</h1>
          <p className="text-sm text-white/70 dark:text-gray-400 mt-2">Restaurant Operations Dashboard</p>
          <p className="text-xs text-white/50 dark:text-gray-500 mt-1">
            Logged in as: {auth.profile?.name} ({auth.profile?.role.replace('_', ' ')})
          </p>
        </div>
        {/* Theme toggle and logout button in top-right */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton variant="icon" />
        </div>
      </div>

      <div className="w-full p-6">
        <div className="app-surface mb-6 overflow-x-auto rounded-2xl shadow-sm border border-[var(--border)]">
          <div className="flex gap-0 bg-[var(--bg-card)]">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 transition-all duration-200 font-semibold text-sm whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="app-surface rounded-2xl p-8 shadow-sm border border-[var(--border)] bg-[var(--bg-card)]">
          {CurrentComponent ? <CurrentComponent /> : null}
        </div>
      </div>

      <div className="mt-12 bg-[var(--bg-strong)] dark:bg-gray-950 py-6 text-center text-white/60 dark:text-gray-400 text-sm">
        <p>ESG FOODPOINT Service Desk | {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
