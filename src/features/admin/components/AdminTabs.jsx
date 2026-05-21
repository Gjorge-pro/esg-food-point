const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'menu', label: 'Menu Management' },
  { id: 'costing', label: 'Costing' },
  { id: 'finance', label: 'Finance' },
  { id: 'stock', label: 'Stock' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'reports', label: 'Reports' },
];

export function AdminTabs({ activeTab, onChange, role = 'admin' }) {
  const visibleTabs = role === 'manager'
    ? tabs.filter((tab) => tab.id === 'reports')
    : tabs;

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-[var(--color-primary)] text-white shadow-md'
              : 'bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-95'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
