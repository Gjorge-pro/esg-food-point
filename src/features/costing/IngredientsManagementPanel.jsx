import { useEffect, useState } from 'react';
import { Panel } from '../../components/Panel';
import ingredientService from '../../services/ingredientService';

const units = ['g', 'kg', 'ml', 'liters', 'pcs', 'portion'];
const inputClass = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

export function IngredientsManagementPanel({ notify }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    unit: 'kg',
    current_stock: '',
    low_stock_threshold: '',
    cost_per_unit: '',
  });
  const [restock, setRestock] = useState({ ingredient_id: '', quantity: '', unit_cost: '' });

  const loadIngredients = async () => {
    setLoading(true);
    try {
      setIngredients(await ingredientService.getIngredients());
    } catch (error) {
      notify?.(error.message || 'Failed to load ingredients.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const submitIngredient = async (event) => {
    event.preventDefault();
    try {
      await ingredientService.saveIngredient(form);
      notify?.('Ingredient saved.', 'success');
      setForm({ name: '', unit: 'kg', current_stock: '', low_stock_threshold: '', cost_per_unit: '' });
      await loadIngredients();
    } catch (error) {
      notify?.(error.message || 'Failed to save ingredient.', 'error');
    }
  };

  const submitRestock = async (event) => {
    event.preventDefault();
    try {
      await ingredientService.restockIngredient(restock.ingredient_id, restock.quantity, restock.unit_cost);
      notify?.('Ingredient stock updated.', 'success');
      setRestock({ ingredient_id: '', quantity: '', unit_cost: '' });
      await loadIngredients();
    } catch (error) {
      notify?.(error.message || 'Failed to restock ingredient.', 'error');
    }
  };

  return (
    <Panel title="Ingredients Management" subtitle="Track raw materials, supplier costs, and low-stock thresholds.">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitIngredient}>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Ingredient</span>
              <input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Flour" required />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Unit</span>
              <select className={inputClass} value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}>
                {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Cost per unit</span>
              <input className={inputClass} type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={(event) => setForm((current) => ({ ...current, cost_per_unit: event.target.value }))} required />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Current stock</span>
              <input className={inputClass} type="number" min="0" step="0.001" value={form.current_stock} onChange={(event) => setForm((current) => ({ ...current, current_stock: event.target.value }))} required />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Low alert</span>
              <input className={inputClass} type="number" min="0" step="0.001" value={form.low_stock_threshold} onChange={(event) => setForm((current) => ({ ...current, low_stock_threshold: event.target.value }))} />
            </label>
            <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white sm:col-span-2">Save Ingredient</button>
          </form>

          <form className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] p-4" onSubmit={submitRestock}>
            <h3 className="font-semibold text-[var(--text-primary)]">Restock Ingredient</h3>
            <select className={inputClass} value={restock.ingredient_id} onChange={(event) => setRestock((current) => ({ ...current, ingredient_id: event.target.value }))} required>
              <option value="">Choose ingredient...</option>
              {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
            </select>
            <input className={inputClass} type="number" min="0" step="0.001" placeholder="Quantity added" value={restock.quantity} onChange={(event) => setRestock((current) => ({ ...current, quantity: event.target.value }))} required />
            <input className={inputClass} type="number" min="0" step="0.01" placeholder="New cost per unit" value={restock.unit_cost} onChange={(event) => setRestock((current) => ({ ...current, unit_cost: event.target.value }))} />
            <button type="submit" className="rounded-2xl border border-brand-200 px-4 py-3 font-semibold text-[var(--text-primary)]">Add Stock</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          {loading ? <p className="py-6 text-center text-sm text-gray-600 dark:text-gray-400">Loading ingredients...</p> : null}
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-gray-600 dark:text-gray-400">
                <th className="px-3 py-3">Ingredient</th>
                <th className="px-3 py-3">Stock</th>
                <th className="px-3 py-3">Alert</th>
                <th className="px-3 py-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => {
                const low = Number(ingredient.current_stock || 0) <= Number(ingredient.low_stock_threshold || 0);
                return (
                  <tr key={ingredient.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{ingredient.name}</td>
                    <td className={low ? 'px-3 py-3 text-red-600 dark:text-red-400' : 'px-3 py-3 text-[var(--text-secondary)]'}>
                      {ingredient.current_stock} {ingredient.unit}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{ingredient.low_stock_threshold} {ingredient.unit}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{Number(ingredient.cost_per_unit).toLocaleString()} / {ingredient.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {ingredients.length === 0 && !loading ? (
            <p className="mt-4 rounded-2xl bg-[var(--bg-main)] px-4 py-5 text-sm text-[var(--text-secondary)]">No ingredients yet. Add flour, sugar, oil, salt, rice, meat, milk, gas, or charcoal.</p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export default IngredientsManagementPanel;
