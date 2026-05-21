import { useEffect, useState } from 'react';
import { Panel } from '../../components/Panel';
import { currency } from '../../lib/formatters';
import recipeService from '../../services/recipeService';
import { createRecipeProductionBatch } from '../../services/productionService';

const inputClass = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

export function ProductionCostPanel({ notify }) {
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState('');
  const [quantityProduced, setQuantityProduced] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadRecipes = async () => {
    try {
      setRecipes(await recipeService.getRecipes());
    } catch (error) {
      notify?.(error.message || 'Failed to load recipes.', 'error');
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPreview() {
      if (!recipeId || !Number(quantityProduced)) {
        setPreview(null);
        return;
      }

      try {
        const costing = await recipeService.calculateRecipeCost(recipeId, quantityProduced);
        if (active) setPreview(costing);
      } catch (error) {
        if (active) setPreview({ error: error.message });
      }
    }

    loadPreview();
    return () => {
      active = false;
    };
  }, [recipeId, quantityProduced]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const batch = await createRecipeProductionBatch(recipeId, Number(quantityProduced));
      notify?.(`Production batch created at ${currency(batch.calculated_cost_per_unit)} per unit.`, 'success');
      setQuantityProduced('');
      setPreview(null);
    } catch (error) {
      notify?.(error.message || 'Failed to create production batch.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Production Cost Breakdown" subtitle="Create FIFO production batches from recipe ingredient costs.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="space-y-4" onSubmit={submit}>
          {recipes.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              No recipes found yet. Open Admin → Costing → Recipe Builder, create a recipe, connect it to a menu item, then return here.
            </div>
          ) : null}
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Recipe</span>
            <select className={inputClass} value={recipeId} onChange={(event) => setRecipeId(event.target.value)} required disabled={recipes.length === 0}>
              <option value="">{recipes.length === 0 ? 'No recipes created yet' : 'Choose recipe...'}</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} {recipe.menu_items?.name ? `(${recipe.menu_items.name})` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Quantity produced</span>
            <input className={inputClass} type="number" min="0.01" step="0.01" value={quantityProduced} onChange={(event) => setQuantityProduced(event.target.value)} placeholder="50" required />
          </label>
          <button type="submit" disabled={loading || recipes.length === 0 || !preview || preview.error} className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loading ? 'Creating batch...' : 'Create Production Batch'}
          </button>
        </form>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] p-4">
          {preview?.error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">{preview.error}</p>
          ) : preview ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Total cost" value={currency(preview.totalCost)} />
                <Metric label="Cost per item" value={currency(preview.costPerUnit)} />
                <Metric label="Yield" value={`${preview.quantityProduced} ${preview.recipe.yield_unit}`} />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-gray-600 dark:text-gray-400">
                      <th className="px-3 py-3">Ingredient</th>
                      <th className="px-3 py-3">Used</th>
                      <th className="px-3 py-3">Cost/unit</th>
                      <th className="px-3 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.breakdown.map((item) => (
                      <tr key={item.ingredient_id} className="border-b border-[var(--border)]">
                        <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{item.ingredient_name}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{item.quantity_used} {item.ingredient_unit}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{currency(item.cost_per_unit)}</td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">{currency(item.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-secondary)]">Select a recipe and quantity to preview real production cost.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export default ProductionCostPanel;
