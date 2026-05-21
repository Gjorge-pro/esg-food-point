import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../components/Toast';

export function MenuManagementPanel() {
  const { addToast } = useToast();
  const { mainCategories, getSubCategories, fetchMenuItemsByCategory } = useCategories();
  
  const [view, setView] = useState('browse'); // browse, add, categories
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editingMainCat, setEditingMainCat] = useState(null);
  const [editingSubCat, setEditingSubCat] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newMainCategory, setNewMainCategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    available: true
  });
  const inputClassName = 'w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500';
  const compactInputClassName = 'w-full px-2 py-1 border rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500';

  // Load menu items when subcategory is selected
  useEffect(() => {
    if (selectedSubCategory) {
      loadMenuItems();
    }
  }, [selectedSubCategory]);

  const loadMenuItems = async () => {
    if (!selectedSubCategory) return;
    const items = await fetchMenuItemsByCategory(selectedSubCategory);
    setMenuItems(items || []);
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!selectedSubCategory || !formData.name || !formData.price) return;

    const result = await supabase.from('menu_items').insert([
      {
        name: formData.name,
        price: parseFloat(formData.price),
        category_id: selectedSubCategory,
        available: formData.available
      }
    ]);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Menu item added', 'success');
      setFormData({ name: '', price: '', available: true });
      loadMenuItems();
    }
  };

  const handleUpdateMenuItem = async () => {
    if (!editingItem) return;

    const result = await supabase
      .from('menu_items')
      .update({
        name: editingItem.name,
        price: parseFloat(editingItem.price),
        available: editingItem.available
      })
      .eq('id', editingItem.id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Menu item updated', 'success');
      setEditingItem(null);
      loadMenuItems();
    }
  };

  const handleDeleteMenuItem = async (id) => {
    const result = await supabase.from('menu_items').delete().eq('id', id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Menu item deleted', 'success');
      loadMenuItems();
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    if (!selectedMainCategory || !newCategory) return;

    const result = await supabase.from('categories').insert([
      {
        name: newCategory,
        parent_id: selectedMainCategory
      }
    ]);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Subcategory added', 'success');
      setNewCategory('');
    }
  };

  const handleAddMainCategory = async (e) => {
    e.preventDefault();
    if (!newMainCategory) return;

    const result = await supabase.from('categories').insert([
      {
        name: newMainCategory,
        parent_id: null
      }
    ]);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Main category added', 'success');
      setNewMainCategory('');
    }
  };

  const handleUpdateMainCategory = async (id, newName) => {
    const result = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Category updated', 'success');
      setEditingMainCat(null);
    }
  };

  const handleDeleteMainCategory = async (id) => {
    const result = await supabase.from('categories').delete().eq('id', id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Category deleted', 'success');
    }
  };

  const handleUpdateSubCategory = async (id, newName) => {
    const result = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Subcategory updated', 'success');
      setEditingSubCat(null);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    const result = await supabase.from('categories').delete().eq('id', id);

    if (result.error) {
      addToast('❌ Error: ' + result.error.message, 'error');
    } else {
      addToast('✅ Subcategory deleted', 'success');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Menu Management</h2>

      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('browse')}
            className={`px-4 py-2 rounded font-semibold ${
            view === 'browse'
              ? 'bg-brand-500 text-white'
              : 'bg-brand-100 text-gray-900 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-gray-100 dark:hover:bg-brand-800/40'
          }`}
        >
          📋 Browse Menu
        </button>
        <button
          onClick={() => setView('categories')}
            className={`px-4 py-2 rounded font-semibold ${
            view === 'categories'
              ? 'bg-brand-500 text-white'
              : 'bg-brand-100 text-gray-900 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-gray-100 dark:hover:bg-brand-800/40'
          }`}
        >
          🏷️ Manage Categories
        </button>
      </div>

      {/* Browse Menu & Add Items */}
      {view === 'browse' && (
        <div className="grid grid-cols-3 gap-4">
          {/* Left: Main Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-4">
            <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Categories</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {mainCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedMainCategory(cat.id);
                    setSelectedSubCategory(null);
                  }}
                    className={`w-full text-left px-3 py-2 rounded transition-all ${
                    selectedMainCategory === cat.id
                      ? 'bg-brand-500 text-white font-semibold'
                      : 'bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-800/30 text-gray-900 dark:text-gray-200'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Middle: Subcategories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-4">
            <h3 className="font-bold mb-3 text-gray-900 dark:text-gray-100">Subcategories</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedMainCategory ? (
                getSubCategories(selectedMainCategory).map(subCat => (
                  <button
                    key={subCat.id}
                    onClick={() => setSelectedSubCategory(subCat.id)}
                    className={`w-full text-left px-3 py-2 rounded transition-all text-sm ${
                      selectedSubCategory === subCat.id
                        ? 'bg-green-600 text-white font-semibold'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {subCat.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">Select a category</p>
              )}
            </div>
          </div>

          {/* Right: Menu Items & Add Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-[var(--border)] p-4 space-y-4">
            {selectedSubCategory && (
              <>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Add Menu Item</h3>
                <form onSubmit={handleAddMenuItem} className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`${inputClassName} text-sm`}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`${inputClassName} text-sm`}
                    required
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    />
                    Available
                  </label>
                  <button
                    type="submit"
                    className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700"
                  >
                    <Plus size={14} className="inline mr-1" />
                    Add Item
                  </button>
                </form>

                <hr className="my-3" />

                <h3 className="font-bold text-gray-900 dark:text-gray-100">Menu Items ({menuItems.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {menuItems.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No items in this category</p>
                  ) : (
                    menuItems.map(item => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border text-sm ${
                          item.available ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700 opacity-60'
                        }`}
                      >
                        {editingItem?.id === item.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, name: e.target.value })
                              }
                              className={compactInputClassName}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editingItem.price}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, price: e.target.value })
                              }
                              className={compactInputClassName}
                            />
                            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={editingItem.available}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, available: e.target.checked })
                                }
                              />
                              Available
                            </label>
                            <div className="flex gap-1">
                              <button
                                onClick={handleUpdateMenuItem}
                                className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                              <p className="text-gray-600 dark:text-gray-400">TSH {parseFloat(item.price).toFixed(2)}</p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="rounded bg-amber-500 p-1 text-white hover:bg-amber-600"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manage Categories */}
      {view === 'categories' && (
        <div className="grid grid-cols-2 gap-4">
          {/* Main Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Main Categories</h3>

            <form onSubmit={handleAddMainCategory} className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <input
                type="text"
                placeholder="New category name"
                value={newMainCategory}
                onChange={(e) => setNewMainCategory(e.target.value)}
                className={inputClassName}
                required
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
              >
                <Plus size={16} className="inline mr-2" />
                Add Main Category
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mainCategories.map(cat => (
                <div
                  key={cat.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-[var(--border)] flex justify-between items-center gap-2"
                >
                  {editingMainCat?.id === cat.id ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="text"
                        value={editingMainCat.name}
                        onChange={(e) => setEditingMainCat({ ...editingMainCat, name: e.target.value })}
                        className={`${inputClassName} flex-1 text-sm`}
                      />
                      <button
                        onClick={() => handleUpdateMainCategory(cat.id, editingMainCat.name)}
                        className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMainCat(null)}
                        className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold flex-1 text-gray-900 dark:text-gray-100">{cat.name}</span>
                      <button
                        onClick={() => setEditingMainCat(cat)}
                        className="rounded bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMainCategory(cat.id)}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subcategories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Subcategories</h3>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Select Main Category:</label>
              <select
                value={selectedMainCategory || ''}
                onChange={(e) => setSelectedMainCategory(Number(e.target.value) || null)}
                className={inputClassName}
              >
                <option value="">-- Choose a category --</option>
                {mainCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedMainCategory && (
              <form onSubmit={handleAddSubCategory} className="space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <input
                  type="text"
                  placeholder="New subcategory name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={inputClassName}
                  required
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                >
                  <Plus size={16} className="inline mr-2" />
                  Add Subcategory
                </button>
              </form>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedMainCategory ? (
                getSubCategories(selectedMainCategory).map(cat => (
                  <div
                    key={cat.id}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-800 flex justify-between items-center gap-2"
                  >
                    {editingSubCat?.id === cat.id ? (
                      <div className="flex-1 flex gap-1">
                        <input
                          type="text"
                          value={editingSubCat.name}
                          onChange={(e) => setEditingSubCat({ ...editingSubCat, name: e.target.value })}
                          className={`${inputClassName} flex-1 text-sm`}
                        />
                        <button
                          onClick={() => handleUpdateSubCategory(cat.id, editingSubCat.name)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSubCat(null)}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold flex-1 text-gray-900 dark:text-gray-100">{cat.name}</span>
                        <button
                          onClick={() => setEditingSubCat(cat)}
                          className="rounded bg-amber-500 p-1.5 text-white hover:bg-amber-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubCategory(cat.id)}
                          className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">Select a main category first</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
