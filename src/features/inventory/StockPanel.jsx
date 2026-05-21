import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStock } from '../../hooks/useStock';
import useInventory from '../../hooks/useInventory';
import { useToast } from '../../components/Toast';

export function StockPanel() {
  const { addToast } = useToast();
  const { opening, usage, closing, addOpening, addUsage, addClosing } = useStock();
  const { lowStockItems } = useInventory();
  const [activeTab, setActiveTab] = useState('opening'); // opening, usage, closing
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [personName, setPersonName] = useState('');

  const handleAddOpening = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) return;
    const result = await addOpening({ item_name: itemName, quantity });
    if (result.success) {
      setItemName('');
      setQuantity('');
      addToast('✅ Opening stock added', 'success');
    }
  };

  const handleAddUsage = async (e) => {
    e.preventDefault();
    if (!personName || !itemName || !quantity) return;
    const result = await addUsage({ person_name: personName, item_name: itemName, quantity });
    if (result.success) {
      setPersonName('');
      setItemName('');
      setQuantity('');
      addToast('✅ Usage recorded', 'success');
    }
  };

  const handleAddClosing = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) return;
    const result = await addClosing({ item_name: itemName, quantity });
    if (result.success) {
      setItemName('');
      setQuantity('');
      addToast('✅ Closing stock recorded', 'success');
    }
  };

  const TabButton = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
        activeTab === tab
          ? 'bg-[var(--color-primary)] text-white shadow-md'
          : 'bg-[var(--bg-main)] text-[var(--text-primary)]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Stock Management</h2>

      {lowStockItems.length > 0 ? (
        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
          <h3 className="font-bold text-red-900 dark:text-red-200">Low Stock Alerts</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                {item.menu_items?.name || `Item #${item.menu_item_id}`}: {item.stock_quantity} {item.unit}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-2">
        <TabButton tab="opening" label="Opening Stock" />
        <TabButton tab="usage" label="Usage Tracking" />
        <TabButton tab="closing" label="Closing Stock" />
      </div>

      {/* Opening Stock */}
      {activeTab === 'opening' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-[var(--border)]">
            <h3 className="font-bold mb-3">Record Opening Stock</h3>
            <form onSubmit={handleAddOpening} className="space-y-2">
              <input
                type="text"
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <button type="submit" className="app-btn-success w-full rounded px-4 py-2">
                <Plus size={16} className="inline mr-2" />
                Add Opening Stock
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {opening.length === 0 ? (
              <p className="py-8 text-center text-ink/60">No opening stock recorded today</p>
            ) : (
              opening.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-[var(--border)]">
                  <p className="font-semibold">{item.item_name}</p>
                  <p className="text-sm text-ink/65 dark:text-gray-400">Quantity: {item.quantity}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Usage Tracking */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-[var(--border)]">
            <h3 className="font-bold mb-3">Record Usage</h3>
            <form onSubmit={handleAddUsage} className="space-y-2">
              <input
                type="text"
                placeholder="Person name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Quantity taken"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <button type="submit" className="app-btn-warning w-full rounded px-4 py-2">
                <Plus size={16} className="inline mr-2" />
                Record Usage
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {usage.length === 0 ? (
              <p className="py-8 text-center text-ink/60">No usage recorded today</p>
            ) : (
              usage.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-[var(--border)]">
                  <p className="font-semibold">{item.person_name}</p>
                  <p className="text-sm text-ink/65 dark:text-gray-400">{item.item_name} × {item.quantity}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Closing Stock */}
      {activeTab === 'closing' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-[var(--border)]">
            <h3 className="font-bold mb-3">Record Closing Stock</h3>
            <form onSubmit={handleAddClosing} className="space-y-2">
              <input
                type="text"
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Quantity remaining"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
              <button type="submit" className="app-btn-primary w-full rounded px-4 py-2">
                <Plus size={16} className="inline mr-2" />
                Add Closing Stock
              </button>
            </form>
          </div>

          <div className="space-y-2">
            {closing.length === 0 ? (
              <p className="py-8 text-center text-ink/60">No closing stock recorded today</p>
            ) : (
              closing.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-[var(--border)]">
                  <p className="font-semibold">{item.item_name}</p>
                  <p className="text-sm text-ink/65 dark:text-gray-400">Remaining: {item.quantity}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
