import { useEffect, useState } from 'react';
import { ToastContainer, useToast } from '../../components/Toast';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { AdminTabs } from './components/AdminTabs';
import { DeliveryTab } from './components/DeliveryTab';
import { CostingTab } from '../costing/CostingTab';
import { FinanceTab } from './components/FinanceTab';
import { MenuManagementTab } from './components/MenuManagementTab';
import { OverviewTab } from './components/OverviewTab';
import { ReportsTab } from './components/ReportsTab';
import { StockTab } from './components/StockTab';
import { DailyOperationsPanel } from '../service/DailyOperationsPanel';

export function AdminView({ role = 'admin' }) {
  const [activeTab, setActiveTab] = useState(role === 'manager' ? 'reports' : 'overview');
  const admin = useAdminDashboard();
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    admin.loadMenuData().catch(() => {});
  }, [admin.loadMenuData]);

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-primary)]/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Owner Console
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">Restaurant Control Center</h2>
          <p className="mt-3 max-w-3xl text-sm text-[var(--text-secondary)]">
            Monitor performance, maintain the menu, track money, analyze stock, review delivery
            operations, and generate reports without relying on realtime subscriptions.
          </p>
        </div>

        {admin.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {admin.error}
          </div>
        ) : null}

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} role={role} />

        {activeTab === 'overview' ? (
          <OverviewTab
            data={admin.overview}
            isLoading={admin.loading.overview}
            onRefresh={admin.loadOverview}
            lastLoadedAt={admin.lastLoadedAt.overview}
          />
        ) : null}

        {activeTab === 'menu' ? (
          <MenuManagementTab
            categories={admin.categories}
            menuItems={admin.menuItems}
            isLoading={admin.loading.menu}
            onLoad={admin.loadMenuData}
            onSaveMenuItem={admin.saveMenuItem}
            onDeleteMenuItem={admin.deleteMenuItem}
            onSaveCategory={admin.saveCategory}
            onDeleteCategory={admin.deleteCategory}
            notify={addToast}
          />
        ) : null}

        {activeTab === 'operations' ? (
          <DailyOperationsPanel mode="admin" />
        ) : null}

        {activeTab === 'finance' ? (
          <FinanceTab
            data={admin.finance}
            isLoading={admin.loading.finance}
            onLoad={admin.loadFinance}
            onSaveIncome={admin.saveIncome}
            onSaveExpense={admin.saveExpense}
            onDeleteIncome={admin.deleteIncome}
            onDeleteExpense={admin.deleteExpense}
            notify={addToast}
            menuItems={admin.menuItems}
          />
        ) : null}

        {activeTab === 'costing' ? (
          <CostingTab
            menuItems={admin.menuItems}
            notify={addToast}
          />
        ) : null}

        {activeTab === 'stock' ? (
          <StockTab
            data={admin.stock}
            isLoading={admin.loading.stock}
            onLoad={admin.loadStock}
            menuItems={admin.menuItems}
            notify={addToast}
          />
        ) : null}

        {activeTab === 'delivery' ? (
          <DeliveryTab
            data={admin.delivery}
            isLoading={admin.loading.delivery}
            onLoad={admin.loadDeliveries}
            onUpdatePaymentStatus={admin.updateDeliveryPaymentStatus}
            notify={addToast}
          />
        ) : null}

        {activeTab === 'reports' ? (
          <ReportsTab
            data={admin.reports}
            isLoading={admin.loading.reports}
            onLoad={admin.loadReports}
            notify={addToast}
          />
        ) : null}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
