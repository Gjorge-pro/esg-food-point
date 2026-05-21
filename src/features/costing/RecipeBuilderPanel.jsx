import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Panel } from '../../components/Panel';
import ingredientService from '../../services/ingredientService';
import recipeService from '../../services/recipeService';

const units = ['g', 'kg', 'ml', 'liters', 'pcs', 'portion'];
const inputClass = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100';

export function RecipeBuilderPanel({ menuItems = [], notify }) {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [form, setForm] = useState({
    name: '',
    menu_item_id: '',
    expected_yield: '',
    yield_unit: 'pcs',
    notes: '',
  });
  const [items, setItems] = useState([{ ingredient_id: '', quantity_required: '', unit: 'kg' }]);

  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId),
    [recipes, selectedRecipeId],
  );

  const loadData = async () => {
    try {
      const [nextIngredients, nextRecipes] = await Promise.all([
        ingredientService.getIngredients(),
        recipeService.getRecipes(),
      ]);
      setIngredients(nextIngredients);
      setRecipes(nextRecipes);
    } catch (error) {
      notify?.(error.message || 'Failed to load recipes.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedRecipe) return;
    setForm({
      name: selectedRecipe.name || '',
      menu_item_id: selectedRecipe.menu_item_id || '',
      expected_yield: selectedRecipe.expected_yield || '',
      yield_unit: selectedRecipe.yield_unit || 'pcs',
      notes: selectedRecipe.notes || '',
      id: selectedRecipe.id,
    });
    setItems(
      selectedRecipe.recipe_items?.length
        ? selectedRecipe.recipe_items.map((item) => ({
            ingredient_id: item.ingredient_id,
            quantity_required: item.quantity_required,
            unit: item.unit,
          }))
        : [{ ingredient_id: '', quantity_required: '', unit: 'kg' }],
    );
  }, [selectedRecipe]);

  const updateItem = (index, patch) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      await recipeService.saveRecipe(form, items);
      notify?.('Recipe saved.', 'success');
      setSelectedRecipeId('');
      setForm({ name: '', menu_item_id: '', expected_yield: '', yield_unit: 'pcs', notes: '' });
      setItems([{ ingredient_id: '', quantity_required: '', unit: 'kg' }]);
      await loadData();
    } catch (error) {
      notify?.(error.message || 'Failed to save recipe.', 'error');
    }
  };

  return (
    <Panel title="Recipe Builder" subtitle="Connect menu items to ingredient formulas and expected production yield.">
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Edit existing recipe</span>
            <select className={inputClass} value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)}>
              <option value="">New recipe...</option>
              {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>)}
            </select>
          </label>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] p-4">
            <p className="font-semibold text-[var(--text-primary)]">Recipe Cost Preview</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              {items.map((item, index) => {
                const ingredient = ingredients.find((entry) => entry.id === item.ingredient_id);
                const cost = Number(item.quantity_required || 0) * Number(ingredient?.cost_per_unit || 0);
                return ingredient ? (
                  <p key={`${item.ingredient_id}-${index}`}>
                    {ingredient.name}: {Number(item.quantity_required || 0).toLocaleString()} {item.unit} x {Number(ingredient.cost_per_unit || 0).toLocaleString()}
                  </p>
                ) : cost ? null : null;
              })}
            </div>
          </div>
        </div>

        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Recipe name</span>
              <input className={inputClass} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Chapati recipe" required />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Menu item</span>
              <select className={inputClass} value={form.menu_item_id} onChange={(event) => setForm((current) => ({ ...current, menu_item_id: event.target.value }))} required>
                <option value="">Connect menu item...</option>
                {menuItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Expected yield</span>
              <input className={inputClass} type="number" min="0.01" step="0.01" value={form.expected_yield} onChange={(event) => setForm((current) => ({ ...current, expected_yield: event.target.value }))} placeholder="50" required />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-400">Yield unit</span>
              <input className={inputClass} value={form.yield_unit} onChange={(event) => setForm((current) => ({ ...current, yield_unit: event.target.value }))} placeholder="pcs" />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Recipe Ingredients</h3>
              <button type="button" onClick={() => setItems((current) => [...current, { ingredient_id: '', quantity_required: '', unit: 'kg' }])} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]">
                <Plus size={16} /> Add
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] p-3 sm:grid-cols-[1fr_120px_120px_44px]">
                <select className={inputClass} value={item.ingredient_id} onChange={(event) => {
                  const ingredient = ingredients.find((entry) => entry.id === event.target.value);
                  updateItem(index, { ingredient_id: event.target.value, unit: ingredient?.unit || item.unit });
                }} required>
                  <option value="">Ingredient...</option>
                  {ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>)}
                </select>
                <input className={inputClass} type="number" min="0.001" step="0.001" value={item.quantity_required} onChange={(event) => updateItem(index, { quantity_required: event.target.value })} placeholder="Qty" required />
                <select className={inputClass} value={item.unit} onChange={(event) => updateItem(index, { unit: event.target.value })}>
                  {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
                <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="mt-2 rounded-xl border border-red-200 p-2 text-red-600 dark:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">Save Recipe</button>
        </form>
      </div>
    </Panel>
  );
}

export default RecipeBuilderPanel;
