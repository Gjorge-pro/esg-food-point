import { useEffect, useState } from 'react';
import { Panel } from '../../../components/Panel';
import { currency } from '../../../lib/formatters';

const emptyItemForm = {
  id: null,
  name: '',
  price: '',
  category_id: '',
  available: true,
};

export function MenuManagementTab({
  categories,
  menuItems,
  isLoading,
  onLoad,
  onSaveMenuItem,
  onDeleteMenuItem,
  onSaveCategory,
  onDeleteCategory,
  notify,
}) {
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [newMainCategory, setNewMainCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    onLoad().catch(() => {});
  }, [onLoad]);

  const mainCategories = categories.filter((category) => category.parent_id === null);
  const subCategories = categories.filter((category) => String(category.parent_id) === String(selectedMainCategory));

  const submitMenuItem = async (event) => {
    event.preventDefault();

    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      notify('Choose a subcategory and fill in all menu item fields.', 'error');
      return;
    }

    try {
      await onSaveMenuItem(itemForm);
      notify(itemForm.id ? 'Menu item updated.' : 'Menu item created.', 'success');
      resetItemForm();
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to save menu item.', 'error');
    }
  };

  const submitMainCategory = async (event) => {
    event.preventDefault();

    if (!newMainCategory.trim()) {
      return;
    }

    try {
      await onSaveCategory({ name: newMainCategory.trim(), parent_id: null });
      notify('Main category created.', 'success');
      setNewMainCategory('');
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to create category.', 'error');
    }
  };

  const submitSubCategory = async (event) => {
    event.preventDefault();

    if (!selectedMainCategory || !newSubCategory.trim()) {
      notify('Select a main category before adding a subcategory.', 'error');
      return;
    }

    try {
      await onSaveCategory({ name: newSubCategory.trim(), parent_id: selectedMainCategory });
      notify('Subcategory created.', 'success');
      setNewSubCategory('');
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to create subcategory.', 'error');
    }
  };

  const submitCategoryEdit = async () => {
    if (!editingCategory?.name?.trim()) {
      return;
    }

    try {
      await onSaveCategory({
        id: editingCategory.id,
        name: editingCategory.name.trim(),
        parent_id: editingCategory.parent_id,
      });
      notify('Category updated.', 'success');
      setEditingCategory(null);
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to update category.', 'error');
    }
  };

  const startEditItem = (item) => {
    const category = categories.find((entry) => entry.id === item.category_id);

    setSelectedMainCategory(String(category?.parent_id || ''));
    setItemForm({
      id: item.id,
      name: item.name,
      price: String(item.price),
      category_id: String(item.category_id),
      available: item.available,
    });
  };

  const removeMenuItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) {
      return;
    }

    try {
      await onDeleteMenuItem(id);
      notify('Menu item deleted.', 'success');
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to delete menu item.', 'error');
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm('Delete this category? This may affect linked subcategories or menu items.')) {
      return;
    }

    try {
      await onDeleteCategory(id);
      notify('Category deleted.', 'success');
      await onLoad();
    } catch (error) {
      notify(error.message || 'Failed to delete category.', 'error');
    }
  };

  const resetItemForm = () => {
    setItemForm(emptyItemForm);
    setSelectedMainCategory('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Menu & Category Management</h2>
          <p className="text-sm text-ink/60">
            Maintain parent-child categories and keep menu items assigned to subcategories only.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onLoad().catch(() => {})}
          className="rounded-2xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink"
        >
          Refresh Data
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Menu Items" subtitle="Create and edit items that customers can order.">
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={submitMenuItem}>
            <label className="sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Item name</span>
              <input
                value={itemForm.name}
                onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Grilled fish platter"
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Price (TSH)</span>
              <input
                type="number"
                min="0"
                step="100"
                value={itemForm.price}
                onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="15000"
              />
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Main category</span>
              <select
                value={selectedMainCategory}
                onChange={(event) => {
                  setSelectedMainCategory(event.target.value);
                  setItemForm((current) => ({ ...current, category_id: '' }));
                }}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="">Select a main category</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Subcategory</span>
              <select
                value={itemForm.category_id}
                onChange={(event) => setItemForm((current) => ({ ...current, category_id: event.target.value }))}
                disabled={!selectedMainCategory}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select a subcategory</option>
                {subCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 sm:col-span-2">
              <input
                type="checkbox"
                checked={itemForm.available}
                onChange={(event) => setItemForm((current) => ({ ...current, available: event.target.checked }))}
              />
              <span className="text-sm text-ink/75">Available to customers right now</span>
            </label>

            <div className="flex flex-wrap gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {itemForm.id ? 'Update item' : 'Create item'}
              </button>
              {itemForm.id ? (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="rounded-2xl border border-brand-200 px-4 py-3 font-medium text-ink"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-ink/50">
                  <th className="px-3 py-3 font-semibold">Item</th>
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 font-semibold">Price</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id} className="border-b border-brand-50">
                    <td className="px-3 py-3 font-medium text-ink">{item.name}</td>
                    <td className="px-3 py-3 text-ink/70">{getCategoryPath(item.category_id, categories)}</td>
                    <td className="px-3 py-3 text-ink/70">{currency(item.price)}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditItem(item)}
                          className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-medium text-ink"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMenuItem(item.id)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {menuItems.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                No menu items available yet.
              </p>
            ) : null}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Main Categories" subtitle="Create and organize the top level of the menu tree.">
            <form className="space-y-3" onSubmit={submitMainCategory}>
              <input
                value={newMainCategory}
                onChange={(event) => setNewMainCategory(event.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Add a main category"
              />
              <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
                Add Main Category
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {mainCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isEditing={editingCategory?.id === category.id}
                  editingName={editingCategory?.name || ''}
                  onStartEdit={setEditingCategory}
                  onChange={(name) => setEditingCategory((current) => ({ ...current, name }))}
                  onSave={submitCategoryEdit}
                  onCancel={() => setEditingCategory(null)}
                  onDelete={() => removeCategory(category.id)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Subcategories" subtitle="Each menu item should belong to one of these child categories.">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/60">Parent category</span>
              <select
                value={selectedMainCategory}
                onChange={(event) => {
                  setSelectedMainCategory(event.target.value);
                  setItemForm((current) => ({ ...current, category_id: '' }));
                }}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="">Select a main category</option>
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <form className="mt-4 space-y-3" onSubmit={submitSubCategory}>
              <input
                value={newSubCategory}
                onChange={(event) => setNewSubCategory(event.target.value)}
                className="w-full rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 outline-none focus:border-brand-500"
                placeholder="Add a subcategory"
              />
              <button type="submit" className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white">
                Add Subcategory
              </button>
            </form>

            <div className="mt-5 space-y-3">
              {subCategories.length > 0 ? (
                subCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    isEditing={editingCategory?.id === category.id}
                    editingName={editingCategory?.name || ''}
                    onStartEdit={setEditingCategory}
                    onChange={(name) => setEditingCategory((current) => ({ ...current, name }))}
                    onSave={submitCategoryEdit}
                    onCancel={() => setEditingCategory(null)}
                    onDelete={() => removeCategory(category.id)}
                  />
                ))
              ) : (
                <p className="rounded-2xl bg-brand-50 px-4 py-5 text-sm text-ink/60">
                  Select a main category to view or manage its subcategories.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  isEditing,
  editingName,
  onStartEdit,
  onChange,
  onSave,
  onCancel,
  onDelete,
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={editingName}
            onChange={(event) => onChange(event.target.value)}
            className="min-w-[220px] flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 outline-none focus:border-brand-500"
          />
          <button type="button" onClick={onSave} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
          <button type="button" onClick={onCancel} className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-medium text-ink">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium text-ink">{category.name}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => onStartEdit(category)} className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-medium text-ink">
              Edit
            </button>
            <button type="button" onClick={onDelete} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryPath(categoryId, categories) {
  const category = categories.find((entry) => entry.id === categoryId);
  const parent = categories.find((entry) => entry.id === category?.parent_id);

  if (!category) return 'Unknown category';
  if (!parent) return category.name;
  return `${parent.name} / ${category.name}`;
}
