import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { currency } from '../../lib/formatters';
import { useToast } from '../../components/Toast';
import { ProductionCostPanel } from '../costing/ProductionCostPanel';

export function ProductionPanel() {
  const { addToast } = useToast();
  const { todayProduction, todayTotal, addProduction, deleteProduction, isLoading } = useProduction();
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    cost_per_unit: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await addProduction(formData);
    if (result.success) {
      setFormData({ item_name: '', quantity: '', cost_per_unit: '' });
      addToast('✅ Production added', 'success');
    } else {
      addToast('❌ Error: ' + result.error, 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteProduction(id);
    if (result.success) {
      addToast('✅ Deleted', 'success');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-[var(--text-primary)]">Production ({todayProduction.length})</h2>

      <ProductionCostPanel notify={addToast} />

      {/* Add Production Form */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h3 className="font-bold mb-3 text-[var(--text-primary)]">Add Production</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Item name"
            value={formData.item_name}
            onChange={(e) => setFormData({...formData, item_name: e.target.value})}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            required
          />
          <input
            type="number"
            placeholder="Cost per unit"
            step="0.01"
            value={formData.cost_per_unit}
            onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus size={16} className="inline mr-2" />
            Add
          </button>
        </form>
      </div>

      {/* Today's Production */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Today's Production: <span className="text-blue-600 dark:text-blue-300">{currency(todayTotal)}</span></p>
      </div>

      {/* Production List */}
      <div className="space-y-2">
        {todayProduction.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-gray-400">No production recorded today</p>
        ) : (
          todayProduction.map(prod => (
            <div key={prod.id} className="flex items-start justify-between rounded border border-[var(--border)] bg-[var(--bg-card)] p-3">
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{prod.item_name}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Qty: {prod.quantity} × {currency(prod.cost_per_unit)} = <strong>{currency(prod.total_value)}</strong>
                </p>
              </div>
              <button
                onClick={() => handleDelete(prod.id)}
                className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
