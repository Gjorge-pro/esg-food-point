const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'operations', label: 'Operations' },
  { id: 'menu', label: 'Menu Management' },
  { id: 'costing', label: 'Costing' },
  { id: 'finance', label: 'Finance' },
  { id: 'stock', label: 'Stock' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'reports', label: 'Reports' },
];

export function AdminTabs({ activeTab, onChange, role = 'admin' }) {
  const visibleTabs = role === 'manager'
    ? tabs.filter((tab) => ['operations', 'reports'].includes(tab.id))
    : tabs;

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="flex gap-2 p-4 bg-[var(--bg-card)] rounded-lg sm:rounded-2xl border border-[var(--border)] shadow-sm min-w-max sm:min-w-full">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-md'
                : 'bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-95'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
